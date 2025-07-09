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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle, AlertCircle, Filter, Plus, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  requires_admin: boolean;
  created_at: string;
  users: {
    full_name: string;
    role: string;
    salary: number;
    department_name: string; // ← add this line
  };
}
// Leave Stats Component
const LeaveStats = ({ requests, user }: { requests: LeaveRequest[]; user: any }) => {
  const getMonthCycleStart = () => {
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 25);
    if (now.getDate() < 25) {
      cycleStart.setMonth(cycleStart.getMonth() - 1);
    }
    return cycleStart;
  };

  const getMonthCycleEnd = () => {
    const start = getMonthCycleStart();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(24);
    return end;
  };

  const currentCycleRequests = requests.filter(req => {
    const reqDate = new Date(req.created_at);
    return reqDate >= getMonthCycleStart() && reqDate <= getMonthCycleEnd();
  });

  const userRequests = user.role === 'admin' ? requests : requests.filter(req => req.user_id === user.id);
  const userCycleRequests = user.role === 'admin' ? currentCycleRequests : currentCycleRequests.filter(req => req.user_id === user.id);

  const stats = {
    total: userRequests.length,
    pending: userRequests.filter(req => req.status === 'pending').length,
    approved: userRequests.filter(req => req.status === 'approved').length,
    rejected: userRequests.filter(req => req.status === 'rejected').length,
    currentCycle: userCycleRequests.filter(req => req.status === 'approved').reduce((sum, req) => sum + req.days_count, 0),
    remaining: Math.max(0, 2 - userCycleRequests.filter(req => req.status === 'approved').reduce((sum, req) => sum + req.days_count, 0))
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">This Cycle</p>
              <p className="text-2xl font-bold">{stats.currentCycle}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold">{stats.remaining}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Leave Filters Component
const LeaveFilters = ({ filters, onFilterChange }: { filters: any; onFilterChange: (filters: any) => void }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Leave Type</Label>
            <Select value={filters.type} onValueChange={(value) => onFilterChange({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                <SelectItem value="Vacation">Vacation</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>From Date</Label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => onFilterChange({ ...filters, fromDate: e.target.value })}
            />
          </div>
          <div>
            <Label>To Date</Label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => onFilterChange({ ...filters, toDate: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};  

// Leave Application Form Component
const LeaveApplicationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    leave_type: '',
    reason: '',
    start_date: '',
    end_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  // Move this after all hooks
  if (!user) return <div>Loading user...</div>;

  const leaveTypes = ['Sick Leave', 'Vacation', 'Personal', 'Maternity', 'Paternity', 'Emergency', 'Others'];

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const getMonthCycleLeaves = async () => {
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 25);
    if (now.getDate() < 25) {
      cycleStart.setMonth(cycleStart.getMonth() - 1);
    }
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    cycleEnd.setDate(24);

    const { data } = await supabase
      .from('leave_requests')
      .select('days_count')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .gte('created_at', cycleStart.toISOString())
      .lte('created_at', cycleEnd.toISOString());

    return data?.reduce((sum, req) => sum + req.days_count, 0) || 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const days = calculateDays(formData.start_date, formData.end_date);
      const currentCycleLeaves = await getMonthCycleLeaves();
      const totalLeaves = currentCycleLeaves + days;

      const requiresAdmin = totalLeaves > 2;
      const salaryDeduction = totalLeaves > 2 ? (totalLeaves - 2) * (user.salary / 30) : 0;

      const { error } = await supabase.from('leave_requests').insert([
        {
          user_id: user.id,
          leave_type: formData.leave_type,
          reason: formData.reason,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_count: days,
          notes: formData.notes,
          salary_deducted: salaryDeduction,
          requires_admin: requiresAdmin
        }
      ]);

      if (error) throw error;
      onSuccess();
      setFormData({ leave_type: '', reason: '', start_date: '', end_date: '', notes: '' });
    } catch (error) {
      console.error('Error submitting leave request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Type of Leave</Label>
        <Select onValueChange={(value) => setFormData({ ...formData, leave_type: value })}>
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
        <Label>Reason</Label>
        <Input
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Enter reason for leave"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      {formData.start_date && formData.end_date && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm"><strong>Days:</strong> {calculateDays(formData.start_date, formData.end_date)}</p>
          <p className="text-sm text-orange-600"><strong>Approval:</strong> {calculateDays(formData.start_date, formData.end_date) > 2 ? 'Requires Admin Approval' : 'Leader Approval'}</p>
        </div>
      )}

      <div>
        <Label>Additional Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
const LeaveRequestCard = ({ request, onAction, canApprove, user }: { request: LeaveRequest; onAction: () => void; canApprove: boolean ; user: any}) => {
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

      // Update salary if approved and deduction needed
      if (action === 'approved' && request.salary_deducted > 0) {
        await supabase
          .from('users')
          .update({
            salary: request.users.salary - request.salary_deducted
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
          <div className="flex items-center gap-2">
            {request.requires_admin && (
              <Badge variant="outline" className="text-orange-600">Admin Required</Badge>
            )}
            <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
              {getStatusIcon(request.status)}
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Reason:</strong> {request.reason}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
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

        {request.status === 'pending' && canApprove && (
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

// Main Leave Page Component
const LeavePage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    fromDate: '',
    toDate: ''
  });

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Debug: Check what user data we have
      console.log('Current user:', user);
      
      // Debug: Get all leave requests without filtering
      const { data: allData, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });
  
      console.log('All leave requests:', allData);
      console.log('Query error:', error);
  
      if (error) throw error;
  
      // Debug: Try with users join
      const { data: withUsers, error: userError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          users!leave_requests_user_id_fkey (full_name, role, salary)
        `)
        .order('created_at', { ascending: false });
  
      console.log('With users join:', withUsers);
      console.log('Users join error:', userError);
  
      setRequests(withUsers || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRequests();
  }, [user]);
  if (!user) {
    return <div className="p-4">Loading user...</div>;
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  const filteredRequests = requests.filter(request => {
    if (filters.status !== 'all' && request.status !== filters.status) return false;
    if (filters.type !== 'all' && request.leave_type !== filters.type) return false;
    if (filters.fromDate && request.start_date < filters.fromDate) return false;
    if (filters.toDate && request.end_date > filters.toDate) return false;
    return true;
  });

  const canApprove = (request: LeaveRequest) => {
    if (user.role === 'admin') return true; // Admin can approve all
    if (user.role === 'leader') return !request.requires_admin && request.user_id !== user.id;
    return false;
  };
  const myRequests = filteredRequests.filter(req => req.user_id === user.id);
  const teamRequests = filteredRequests.filter(req => req.user_id !== user.id);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        {/* Remove Apply Leave button for admin */}
        {user.role !== 'admin' && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Apply Leave
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Request Time Off</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <LeaveApplicationForm onSuccess={() => { setSheetOpen(false); fetchRequests(); }} />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <LeaveStats requests={requests} user={user} />
      <LeaveFilters filters={filters} onFilterChange={setFilters} />

      {user.role === 'leader' ? (
        <Tabs defaultValue="my-leaves" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
            <TabsTrigger value="team-leaves">Team Leaves</TabsTrigger>
          </TabsList>
          <TabsContent value="my-leaves" className="space-y-4">
            {myRequests.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><p className="text-gray-500">No leave requests found.</p></CardContent></Card>
            ) : (
              myRequests.map((request) => (
                <LeaveRequestCard key={request.id} request={request} onAction={fetchRequests} canApprove={false} user={user} />
              ))
            )}
          </TabsContent>
          <TabsContent value="team-leaves" className="space-y-4">
            {teamRequests.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><p className="text-gray-500">No team leave requests found.</p></CardContent></Card>
            ) : (
              teamRequests.map((request) => (
                <LeaveRequestCard key={request.id} request={request} onAction={fetchRequests} canApprove={canApprove(request)} user={user} />
              ))
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card><CardContent className="p-8 text-center"><p className="text-gray-500">No leave requests found.</p></CardContent></Card>
          ) : (
            filteredRequests.map((request) => (
              <LeaveRequestCard key={request.id} request={request} onAction={fetchRequests} canApprove={canApprove(request)} user={user} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LeavePage;