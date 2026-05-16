import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchKPISubCategories, 
  createKPISubCategory, 
  updateKPISubCategory, 
  deleteKPISubCategory,
  KPISubCategoryDTO 
} from '../../../api/kpiSubCategoryApi';
import { fetchKPICategories, KPICategoryDTO } from '../../../api/kpiCategoryApi';
import { fetchLines, LineDTO } from '../../../api/linesApi';
import { fetchServiceProviders, ServiceProviderDTO } from '../../../api/serviceProviderApi';

const { Title } = Typography;
const { confirm } = Modal;

const KPISubCategoriesManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<KPISubCategoryDTO[]>([]);
  const [mainCategories, setMainCategories] = useState<KPICategoryDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProviderDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<KPISubCategoryDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subData, mainData, linesData, spData] = await Promise.all([
        fetchKPISubCategories(),
        fetchKPICategories(),
        fetchLines(),
        fetchServiceProviders()
      ]);
      setRecords(subData);
      setMainCategories(mainData);
      setLines(linesData);
      setServiceProviders(spData);
    } catch (error: any) {
      message.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFinish = async (values: any) => {
    const payload: any = {
      ...values,
      fl_category_id: values.fl_category_id || 1, // Placeholder until FL category is implemented
    };

    if (editing) {
      payload.sub_category_id = editing.sub_category_id;
    }

    try {
      if (editing) {
        await updateKPISubCategory(payload);
        message.success('KPI Sub-Category updated successfully!');
      } else {
        await createKPISubCategory(payload);
        message.success('KPI Sub-Category added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.sub_category_id) === String(id));
    if (rec) {
      setEditing(rec);
      form.setFieldsValue(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this KPI sub-category?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteKPISubCategory(Number(id));
          message.success('KPI Sub-Category deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const mainCatOptions = mainCategories.map((m) => ({ value: m.kpi_main_cat_id, label: m.kpi_name }));
  const lineOptions = lines.map((l) => ({ value: l.line_id, label: l.line_name }));
  const spOptions = serviceProviders.map((s) => ({ value: s.sp_id, label: s.sp_name }));

  const columns = [
    { title: 'Service Provider', dataIndex: 'sp_name', key: 'sp_name' },
    { title: 'Line', key: 'line_name', render: () => 'Orange Line/Airport Service' },
    { title: 'Main Category', dataIndex: 'main_category_name', key: 'main_category_name' },
    { title: 'Sub-Category Name', dataIndex: 'sub_category_name', key: 'sub_category_name' },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>KPI Sub-Categories Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="sp_id" label="Service Provider" rules={[{ required: true }]}>
                <Select placeholder="Select provider" size="large" options={spOptions} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_id" label="Line" rules={[{ required: true }]}>
                <Select placeholder="Select line" size="large" options={lineOptions} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="kpi_main_cat_id" label="Main Category" rules={[{ required: true }]}>
                <Select placeholder="Select category" size="large" options={mainCatOptions} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="sub_category_name" label="Sub-Category Name" rules={[{ required: true }]}>
                <Input placeholder="Enter sub-category" size="large" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="fl_category_id" hidden initialValue={1}>
            <Input />
          </Form.Item>

          <Row justify="end" style={{ marginTop: 8 }}>
            <Col>
              <div style={{ display: 'flex', gap: 12 }}>
                {editing && (
                  <Button size="large" onClick={() => { setEditing(null); form.resetFields(); }}>
                    Cancel
                  </Button>
                )}
                <Button type="primary" htmlType="submit" size="large" icon={editing ? <EditOutlined /> : <PlusOutlined />}>
                  {editing ? 'Update Sub-Category' : 'Add Sub-Category'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="KPI Sub-Categories List" 
        dataSource={records.map(r => ({ ...r, id: String(r.sub_category_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="kpi_sub_categories" 
        loading={loading}
      />
    </>
  );
};

export default KPISubCategoriesManager;
