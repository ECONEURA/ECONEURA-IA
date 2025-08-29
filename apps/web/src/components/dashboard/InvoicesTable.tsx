'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
// import { Invoice } from '../../lib/api-client';

interface InvoicesTableProps {
  invoices: any[];
  onStartCobro?: (invoiceIds: string[]) => void;
  loading?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export default function InvoicesTable({
  invoices,
  onStartCobro,
  loading = false,
  selectedIds = [],
  onSelectionChange,
}: InvoicesTableProps) {
  const [sortField, setSortField] = useState<string>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? invoices.map(inv => inv.id) : []);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, invoiceId]);
      } else {
        onSelectionChange(selectedIds.filter(id => id !== invoiceId));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <StatusBadge status="success">Paid</StatusBadge>;
      case 'sent':
        return <StatusBadge status="info">Sent</StatusBadge>;
      case 'overdue':
        return <StatusBadge status="danger">Overdue</StatusBadge>;
      case 'cancelled':
        return <StatusBadge status="neutral">Cancelled</StatusBadge>;
      default:
        return <StatusBadge status="warning">Draft</StatusBadge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const canStartCobro = selectedIds.length > 0 && onStartCobro;
  const allSelected = selectedIds.length === invoices.length && invoices.length > 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < invoices.length;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Overdue Invoices ({invoices.length})
          </h2>
          {canStartCobro && (
            <button
              onClick={() => onStartCobro(selectedIds)}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start Cobro ({selectedIds.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('customer_name')}
              >
                <div className="flex items-center gap-1">
                  Customer
                  {sortField === 'customer_name' && (
                    <svg className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Amount
                  {sortField === 'amount' && (
                    <svg className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('due_date')}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  {sortField === 'due_date' && (
                    <svg className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th>Status</th>
              <th>Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.map((invoice) => {
              const daysOverdue = Math.floor(
                (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedIds.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">
                        {invoice.customer_name || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className="font-medium text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="text-gray-900">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td>
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td>
                    <span className={`font-medium ${
                      daysOverdue > 30 ? 'text-danger-600' : 
                      daysOverdue > 7 ? 'text-warning-600' : 
                      'text-gray-600'
                    }`}>
                      {daysOverdue} days
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No overdue invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
}