'use client'
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Types        
interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  notes: string;
  salary_deducted: number;
  created_at: string;
  users: {
    full_name: string;
    department_name: string;
    role: string;
  };
}

// Leave Application Form Component
const LeaveApplicationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { user } = useAuth();
  if (!user) return null;
  const [formData, setFormData] = useState({
    leave_type: '',
    reason: '',
    start_date: '',
    end_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const leaveTypes = [
    'Sick Leave',
    'Vacation',
    'Personal',
    'Maternity',
    'Paternity',
    'Emergency',
    'Others'
  ];

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const calculateSalaryDeduction = (days: number, salary: number) => {
    if (days <= 2) return 0;
    const perDaySalary = salary / 30;
    return (days - 2) * perDaySalary;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const days = calculateDays(formData.start_date, formData.end_date);
    const salaryDeduction = calculateSalaryDeduction(days, user.salary);

      const { error } = await supabase.from('leave_requests').insert([
        {
          user_id: user.id,
          leave_type: formData.leave_type,
          reason: formData.reason,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_count: days,
          notes: formData.notes,
          salary_deducted: salaryDeduction
        }
      ]);

      if (error) throw error;

      // Update user's leave count
      await supabase
        .from('users')
        .update({ leave_taken: user.leave_taken + days })
        .eq('id', user.id);

      onSuccess();
      setFormData({
        leave_type: '',
        reason: '',
        start_date: '',
        end_date: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting leave request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="leave_type">Type of Leave</Label>
        <Select onValueChange={(value) => setFormData({...formData, leave_type: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({...formData, reason: e.target.value})}
          placeholder="Enter reason for leave"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
          />
        </div>
      </div>

      {formData.start_date && formData.end_date && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm">
            <strong>Days:</strong> {calculateDays(formData.start_date, formData.end_date)}
          </p>
          {calculateDays(formData.start_date, formData.end_date) > 2 && (
            <p className="text-sm text-red-600">
              <strong>Salary Deduction:</strong> ₹{calculateSalaryDeduction(calculateDays(formData.start_date, formData.end_date), user.salary).toFixed(2)}
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Any additional information"
          rows={3}
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading || !formData.leave_type || !formData.reason || !formData.start_date || !formData.end_date} className="w-full">
        {loading ? 'Submitting...' : 'Submit Leave Request'}
      </Button>
    </div>
  );
};

// Leave Request Card Component
const LeaveRequestCard = ({ request, onAction }: { request: LeaveRequest; onAction: () => void }) => {
  const { user } = useAuth();
  if (!user) return null;
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: action,
          approved_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      // If approved and salary deduction needed, update user salary
      if (action === 'approved' && request.salary_deducted > 0) {
        await supabase
          .from('users')
          .update({
            salary: user.salary - request.salary_deducted
          })
          .eq('id', request.user_id);
      }

      onAction();
    } catch (error) {
      console.error('Error updating leave request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{request.leave_type}</CardTitle>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-4 h-4" />
              {request.users.full_name} - {request.users.department_name}
            </p>
          </div>
          <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
            {getStatusIcon(request.status)}
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Reason:</strong> {request.reason}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {request.start_date} to {request.end_date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {request.days_count} day(s)
            </span>
            {request.salary_deducted > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <DollarSign className="w-4 h-4" />
                ₹{request.salary_deducted.toFixed(2)} deduction
              </span>
            )}
          </div>
          {request.notes && (
            <p className="text-sm text-gray-600"><strong>Notes:</strong> {request.notes}</p>
          )}
        </div>

        {request.status === 'pending' && (user.role === 'admin' || user.role === 'leader') && (
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => handleAction('approved')}
              disabled={loading}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              size="sm"
              variant="destructive"
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Leave Management Component
const LeaveManagement = () => {
  const { user } = useAuth();
  if (!user) return null;
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          users (full_name, department_name, role)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (user.role === 'employee') {
        query = query.eq('user_id', user.id);
      } else if (user.role === 'leader') {
        query = query.eq('users.department_name', user.department_name);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleSuccess = () => {
    setSheetOpen(false);
    fetchRequests();
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leave Management</h2>
        {user.role !== 'admin' && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>Request Leave</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Request Time Off</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <LeaveApplicationForm onSuccess={handleSuccess} />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No leave requests found.</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              onAction={fetchRequests}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;