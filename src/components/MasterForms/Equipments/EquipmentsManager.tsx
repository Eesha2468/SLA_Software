import { EditOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import GenericList from '../GenericList';


const { Title } = Typography;

interface EquipmentData {
  id: string;
  equipmentName: string;
  type: string;
  category?: string;
  serialNumber: string;
  macAddress?: string;
  make?: string;
  model?: string;
  status: string;
}

const EquipmentsManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<EquipmentData[]>([]);
  const [editing, setEditing] = useState<EquipmentData | null>(null);

  const onFinish = (values: Omit<EquipmentData, 'id'>) => {
    if (editing) {
      setRecords((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...values } : r)));
      message.success('Equipment updated!');
      setEditing(null);
    } else {
      setRecords((prev) => [...prev, { ...values, id: uuidv4() }]);
      message.success('Equipment added!');
    }
    form.resetFields();
  };

  const handleEdit = (id: string) => {
    const rec = records.find((r) => r.id === id);
    if (rec) { setEditing(rec); form.setFieldsValue(rec); }
  };

  const columns = [
    { title: 'Equipment Name', dataIndex: 'equipmentName' },
    { title: 'Type', dataIndex: 'type', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Category', dataIndex: 'category', render: (v: string) => v || '—' },
    { title: 'Serial Number', dataIndex: 'serialNumber' },
    { title: 'Make', dataIndex: 'make', render: (v: string) => v || '—' },
    { title: 'Model', dataIndex: 'model', render: (v: string) => v || '—' },
    { title: 'Status', dataIndex: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : v === 'inactive' ? 'red' : 'orange'}>{v}</Tag> },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>Equipments Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="equipmentName" label="Equipment Name" rules={[{ required: true }]}>
                <Input placeholder="Enter equipment name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="type" label="Equipment Type" rules={[{ required: true }]}>
                <Select placeholder="Select type" options={[{ value: 'Hardware', label: 'Hardware' }, { value: 'Software', label: 'Software' }, { value: 'Network', label: 'Network' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="category" label="Category">
                <Select placeholder="Select category" options={[
                  { value: 'POS', label: 'POS' }, { value: 'PDA', label: 'PDA' },
                  { value: 'TVM', label: 'TVM' }, { value: 'Validator', label: 'Validator' },
                  { value: 'Fare Gate', label: 'Fare Gate' }, { value: 'Server', label: 'Server' },
                ]} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="serialNumber" label="Serial Number" rules={[{ required: true }]}>
                <Input placeholder="Enter serial number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="macAddress" label="MAC Address">
                <Input placeholder="Enter MAC" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="make" label="Make">
                <Input placeholder="Enter make" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="model" label="Model">
                <Input placeholder="Enter model" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select placeholder="Select status" size="large" options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'maintenance', label: 'Maintenance' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" style={{ marginTop: 8 }}>
            <Col>
              <div style={{ display: 'flex', gap: 12 }}>
                {editing && (
                  <Button size="large" onClick={() => { setEditing(null); form.resetFields(); }}>
                    Cancel
                  </Button>
                )}
                <Button type="primary" htmlType="submit" size="large" icon={editing ? <EditOutlined /> : <PlusOutlined />}>
                  {editing ? 'Update Equipment' : 'Add Equipment'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList title="Equipments List" dataSource={records} columns={columns} onEdit={handleEdit} exportFilename="equipments" />
    </>
  );
};

export default EquipmentsManager;
