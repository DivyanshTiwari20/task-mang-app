// components/SalarySection.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react'

interface SalaryData {
  total_salary: number
  deductions: number
  net_salary: number
  // Add new salary fields here
}

interface SalarySectionProps {
  salaryData: SalaryData
  canViewDetails: boolean
}

export default function SalarySection({ salaryData, canViewDetails }: SalarySectionProps) {
  // Format currency - Easy to modify for different currencies
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate deduction percentage
  const deductionPercentage = ((salaryData.deductions / salaryData.total_salary) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Information
          </CardTitle>
          {canViewDetails && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Slip
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Net salary highlight */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Net Salary</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(salaryData.net_salary)}
            </p>
          </div>

          {/* Salary breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Gross Salary</span>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(salaryData.total_salary)}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Deductions</span>
              </div>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(salaryData.deductions)}
              </p>
              <p className="text-xs text-muted-foreground">
                ({deductionPercentage}% of gross)
              </p>
            </div>
          </div>

          {/* Salary details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Gross Salary</span>
              <span className="font-medium">{formatCurrency(salaryData.total_salary)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Deductions</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(salaryData.deductions)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-2 border-green-200">
              <span className="font-medium">Net Salary</span>
              <span className="font-bold text-green-600">
                {formatCurrency(salaryData.net_salary)}
              </span>
            </div>
          </div>

          {/* Salary badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-green-500 text-green-700">
              Net: {formatCurrency(salaryData.net_salary)}
            </Badge>
            <Badge variant="outline" className="border-blue-500 text-blue-700">
              Gross: {formatCurrency(salaryData.total_salary)}
            </Badge>
            <Badge variant="outline" className="border-red-500 text-red-700">
              Deductions: {deductionPercentage}%
            </Badge>
          </div>

          {/* 
            Add new salary components here:
            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Salary Components</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary:</span>
                  <span>{formatCurrency(salaryData.basic_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowances:</span>
                  <span>{formatCurrency(salaryData.allowances)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bonus:</span>
                  <span>{formatCurrency(salaryData.bonus)}</span>
                </div>
              </div>
            </div>
          */}
        </div>
      </CardContent>
    </Card>
  )
}