import React from 'react'
import {EmployeeList} from '@/components/EmployeeList'  // your actual list component

export default function EmployeeListPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Employees</h1>
      <EmployeeList />
    </div>
  )
}
