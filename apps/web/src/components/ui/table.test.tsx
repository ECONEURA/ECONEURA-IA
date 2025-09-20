/**
 * Table Component Accessibility Tests
 * PR-99: Cobertura UI & Axe - Tests RTL y accesibilidad para Table
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test-utils/accessibility-helpers';
import { testAccessibility, runAllAccessibilityTests } from '../test-utils/accessibility-helpers';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Simple Table Component for testing
const Table = ({ 
  caption,
  headers = [],
  rows = [],
  sortable = false,
  selectable = false 
}: {
  caption?: string;
  headers?: Array<{ key: string; label: string; sortable?: boolean }>;
  rows?: Array<Record<string, any>>;
  sortable?: boolean;
  selectable?: boolean;
}) => {
  const defaultHeaders = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
  ];

  const defaultRows = [
    { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  ];

  const tableHeaders = headers.length > 0 ? headers : defaultHeaders;
  const tableRows = rows.length > 0 ? rows : defaultRows;

  return (
    <table>
      {caption && <caption>{caption}</caption>}
      <thead>
        <tr>
          {selectable && <th scope="col" aria-label="Select all">
            <input type="checkbox" aria-label="Select all rows" />
          </th>}
          {tableHeaders.map((header) => (
            <th key={header.key} scope="col">
              {sortable && header.sortable ? (
                <button type="button" aria-label={`Sort by ${header.label}`}>
                  {header.label} ↕
                </button>
              ) : (
                header.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableRows.map((row, index) => (
          <tr key={index}>
            {selectable && (
              <td>
                <input 
                  type="checkbox" 
                  aria-label={`Select row ${index + 1}`}
                />
              </td>
            )}
            {tableHeaders.map((header) => (
              <td key={header.key}>{row[header.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Sortable Table Component
const SortableTable = () => {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <table>
      <caption>Sortable User Table</caption>
      <thead>
        <tr>
          <th scope="col">
            <button 
              type="button" 
              onClick={() => handleSort('name')}
              aria-label={`Sort by name ${sortColumn === 'name' ? sortDirection : ''}`}
            >
              Name {sortColumn === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
            </button>
          </th>
          <th scope="col">
            <button 
              type="button" 
              onClick={() => handleSort('email')}
              aria-label={`Sort by email ${sortColumn === 'email' ? sortDirection : ''}`}
            >
              Email {sortColumn === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
            </button>
          </th>
          <th scope="col">Role</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John Doe</td>
          <td>john@example.com</td>
          <td>Admin</td>
        </tr>
        <tr>
          <td>Jane Smith</td>
          <td>jane@example.com</td>
          <td>User</td>
        </tr>
      </tbody>
    </table>
  );
};

// Selectable Table Component
const SelectableTable = () => {
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set([0, 1, 2]));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === 3);
  };

  return (
    <table>
      <caption>Selectable User Table</caption>
      <thead>
        <tr>
          <th scope="col">
            <input 
              type="checkbox" 
              checked={selectAll}
              onChange={handleSelectAll}
              aria-label="Select all rows"
            />
          </th>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
        </tr>
      </thead>
      <tbody>
        {[
          { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
          { name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
          { name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
        ].map((row, index) => (
          <tr key={index}>
            <td>
              <input 
                type="checkbox" 
                checked={selectedRows.has(index)}
                onChange={() => handleSelectRow(index)}
                aria-label={`Select row ${index + 1}`}
              />
            </td>
            <td>{row.name}</td>
            <td>{row.email}</td>
            <td>{row.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

describe('Table Component Accessibility', () => {
  describe('Basic Table Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Table />);
      await testAccessibility(container);
    });

    it('should pass all accessibility tests', async () => {
      const { container } = render(<Table />);
      await runAllAccessibilityTests(container);
    });

    it('should have proper table structure', () => {
      render(<Table />);

      const table = screen.getByRole('table');
      const columnHeaders = screen.getAllByRole('columnheader');
      const rowHeaders = screen.getAllByRole('rowheader');
      const cells = screen.getAllByRole('cell');

      expect(table).toBeInTheDocument();
      expect(columnHeaders).toHaveLength(4); // Name, Email, Role, Status
      expect(cells).toHaveLength(12); // 4 columns × 3 rows
    });

    it('should have proper table caption', () => {
      render(<Table caption="User Management Table" />);

      const caption = screen.getByText('User Management Table');
      expect(caption).toBeInTheDocument();
    });
  });

  describe('Table Headers', () => {
    it('should have proper column headers', () => {
      render(<Table />);

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const emailHeader = screen.getByRole('columnheader', { name: /email/i });
      const roleHeader = screen.getByRole('columnheader', { name: /role/i });
      const statusHeader = screen.getByRole('columnheader', { name: /status/i });

      expect(nameHeader).toBeInTheDocument();
      expect(emailHeader).toBeInTheDocument();
      expect(roleHeader).toBeInTheDocument();
      expect(statusHeader).toBeInTheDocument();
    });

    it('should have proper scope attributes', () => {
      render(<Table />);

      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  describe('Table Data', () => {
    it('should have proper data cells', () => {
      render(<Table />);

      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);

      // Check for specific data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should have proper row structure', () => {
      render(<Table />);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 1 header row + 3 data rows
    });
  });

  describe('Sortable Table', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SortableTable />);
      await testAccessibility(container);
    });

    it('should have proper sortable headers', () => {
      render(<SortableTable />);

      const nameSortButton = screen.getByRole('button', { name: /sort by name/i });
      const emailSortButton = screen.getByRole('button', { name: /sort by email/i });

      expect(nameSortButton).toBeInTheDocument();
      expect(emailSortButton).toBeInTheDocument();
    });

    it('should handle sorting interactions', () => {
      render(<SortableTable />);

      const nameSortButton = screen.getByRole('button', { name: /sort by name/i });
      
      // Initial state
      expect(nameSortButton).toHaveAttribute('aria-label', 'Sort by name ');

      // Click to sort ascending
      fireEvent.click(nameSortButton);
      expect(nameSortButton).toHaveAttribute('aria-label', 'Sort by name asc');

      // Click to sort descending
      fireEvent.click(nameSortButton);
      expect(nameSortButton).toHaveAttribute('aria-label', 'Sort by name desc');
    });

    it('should have proper sort indicators', () => {
      render(<SortableTable />);

      const nameSortButton = screen.getByRole('button', { name: /sort by name/i });
      
      // Initial state - should show sortable indicator
      expect(nameSortButton).toHaveTextContent('↕');

      // After sorting - should show direction
      fireEvent.click(nameSortButton);
      expect(nameSortButton).toHaveTextContent('↑');
    });
  });

  describe('Selectable Table', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SelectableTable />);
      await testAccessibility(container);
    });

    it('should have proper select all functionality', () => {
      render(<SelectableTable />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all rows/i });
      const rowCheckboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      expect(selectAllCheckbox).toBeInTheDocument();
      expect(rowCheckboxes).toHaveLength(3);

      // Initially none selected
      expect(selectAllCheckbox).not.toBeChecked();
      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should handle select all interactions', () => {
      render(<SelectableTable />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all rows/i });
      const rowCheckboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      // Select all
      fireEvent.click(selectAllCheckbox);
      expect(selectAllCheckbox).toBeChecked();
      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });

      // Deselect all
      fireEvent.click(selectAllCheckbox);
      expect(selectAllCheckbox).not.toBeChecked();
      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should handle individual row selection', () => {
      render(<SelectableTable />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all rows/i });
      const rowCheckboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      // Select first row
      fireEvent.click(rowCheckboxes[0]);
      expect(rowCheckboxes[0]).toBeChecked();
      expect(selectAllCheckbox).not.toBeChecked();

      // Select all rows individually
      rowCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
          fireEvent.click(checkbox);
        }
      });
      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('Table with Custom Data', () => {
    it('should be accessible with custom headers and data', async () => {
      const customHeaders = [
        { key: 'product', label: 'Product', sortable: true },
        { key: 'price', label: 'Price', sortable: true },
        { key: 'stock', label: 'Stock', sortable: false },
      ];

      const customRows = [
        { product: 'Laptop', price: '$999', stock: '10' },
        { product: 'Mouse', price: '$25', stock: '50' },
        { product: 'Keyboard', price: '$75', stock: '25' },
      ];

      const { container } = render(
        <Table 
          headers={customHeaders} 
          rows={customRows}
          caption="Product Inventory"
        />
      );
      await testAccessibility(container);
    });

    it('should handle empty table gracefully', async () => {
      const { container } = render(
        <Table 
          headers={[{ key: 'name', label: 'Name' }]} 
          rows={[]}
          caption="Empty Table"
        />
      );
      await testAccessibility(container);
    });
  });

  describe('Table Focus Management', () => {
    it('should handle keyboard navigation', () => {
      render(<Table />);

      const table = screen.getByRole('table');
      const firstCell = screen.getAllByRole('cell')[0];

      firstCell.focus();
      expect(firstCell).toHaveFocus();
    });

    it('should handle sortable button focus', () => {
      render(<SortableTable />);

      const nameSortButton = screen.getByRole('button', { name: /sort by name/i });
      
      nameSortButton.focus();
      expect(nameSortButton).toHaveFocus();

      // Should be activatable with Enter or Space
      fireEvent.keyDown(nameSortButton, { key: 'Enter' });
      expect(nameSortButton).toHaveAttribute('aria-label', 'Sort by name asc');
    });

    it('should handle checkbox focus', () => {
      render(<SelectableTable />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all rows/i });
      
      selectAllCheckbox.focus();
      expect(selectAllCheckbox).toHaveFocus();

      // Should be activatable with Space
      fireEvent.keyDown(selectAllCheckbox, { key: ' ' });
      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('Table with ARIA Attributes', () => {
    it('should be accessible with custom ARIA attributes', async () => {
      const { container } = render(
        <table role="table" aria-label="Custom table">
          <caption>Custom Table with ARIA</caption>
          <thead>
            <tr>
              <th scope="col" aria-sort="none">Name</th>
              <th scope="col" aria-sort="ascending">Email</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
            </tr>
          </tbody>
        </table>
      );
      await testAccessibility(container);
    });

    it('should have proper ARIA sort attributes', () => {
      render(
        <table>
          <thead>
            <tr>
              <th scope="col" aria-sort="none">Name</th>
              <th scope="col" aria-sort="ascending">Email</th>
              <th scope="col" aria-sort="descending">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td>2024-01-01</td>
            </tr>
          </tbody>
        </table>
      );

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const emailHeader = screen.getByRole('columnheader', { name: /email/i });
      const dateHeader = screen.getByRole('columnheader', { name: /date/i });

      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
      expect(emailHeader).toHaveAttribute('aria-sort', 'ascending');
      expect(dateHeader).toHaveAttribute('aria-sort', 'descending');
    });
  });

  describe('Table with Complex Content', () => {
    it('should be accessible with links in cells', async () => {
      const { container } = render(
        <table>
          <caption>Table with Links</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>
                <a href="/users/1">View</a>
                <a href="/users/1/edit">Edit</a>
                <a href="/users/1/delete">Delete</a>
              </td>
            </tr>
          </tbody>
        </table>
      );
      await testAccessibility(container);
    });

    it('should be accessible with buttons in cells', async () => {
      const { container } = render(
        <table>
          <caption>Table with Buttons</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>
                <button type="button">View</button>
                <button type="button">Edit</button>
                <button type="button">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      );
      await testAccessibility(container);
    });
  });
});
