import React from 'react';
import { Table, Button, Space, Dropdown, Popconfirm } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnsType } from 'antd/es/table';

interface GenericListProps<T extends { id: string }> {
  title: string;
  dataSource: T[];
  columns: ColumnsType<T>;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
  exportFilename?: string;
  loading?: boolean;
}

function GenericList<T extends { id: string }>({
  title,
  dataSource,
  columns,
  onEdit,
  onDelete,
  exportFilename = 'export',
  loading = false,
}: GenericListProps<T>) {
  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(dataSource);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, title);
    XLSX.writeFile(wb, `${exportFilename}.xlsx`);
  };

  const exportCSV = () => {
    const sheet = XLSX.utils.json_to_sheet(dataSource);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFilename}.csv`;
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    const keys = Object.keys(dataSource[0] || {}).filter((k) => k !== 'id');
    const rows = dataSource.map((row: any) => keys.map((k) => String(row[k] ?? '—')));
    autoTable(doc, {
      startY: 30,
      head: [keys],
      body: rows,
      styles: { fontSize: 9 },
    });
    doc.save(`${exportFilename}.pdf`);
  };

  const exportMenu = [
    { key: 'excel', icon: <FileExcelOutlined />, label: 'Export Excel', onClick: exportExcel },
    { key: 'csv', icon: <FileTextOutlined />, label: 'Export CSV', onClick: exportCSV },
    { key: 'pdf', icon: <FilePdfOutlined />, label: 'Export PDF', onClick: exportPDF },
  ];

  const allColumns = [
    ...columns,
    {
      title: 'Actions',
      render: (_: unknown, record: T) => (
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(record.id)}>
            Edit
          </Button>
          {onDelete && (
            <Popconfirm
              title="Delete the task"
              description="Are you sure to delete this task?"
              onConfirm={() => onDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={allColumns}
      dataSource={dataSource}
      bordered
      loading={loading}
      pagination={{ pageSize: 10 }}
      title={() => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>{title}</strong>
          <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
            <Button type="primary">
              Export <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      )}
    />
  );
}

export default GenericList;
