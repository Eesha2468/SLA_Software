import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, Select, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { fetchSettings, saveSettings, SettingsDTO } from '../api/settingsApi';

const { Title } = Typography;

const Settings: React.FC = () => {
  const [systemForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettingsData = async () => {
    try {
      const data = await fetchSettings();
      systemForm.setFieldsValue({
        systemName: data.system_name,
        organization: data.organization,
        timezone: data.timezone,
        dateFormat: data.date_format,
      });
      sessionStorage.setItem('settings', JSON.stringify(data));
      window.dispatchEvent(new Event('settings-updated'));
    } catch (error: any) {
      message.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload: SettingsDTO = {
        system_name: values.systemName,
        organization: values.organization,
        timezone: values.timezone,
        date_format: values.dateFormat,
      };
      const savedData = await saveSettings(payload);
      sessionStorage.setItem('settings', JSON.stringify(savedData));
      window.dispatchEvent(new Event('settings-updated'));
      message.success('System settings saved successfully!');
    } catch (error: any) {
      message.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Settings</Title>

      {/* System Settings */}
      <Card title="System Settings" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={systemForm} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="systemName" label="System Name" rules={[{ required: true, message: 'Please enter system name' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="organization" label="Organization" rules={[{ required: true, message: 'Please enter organization' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="timezone" label="Timezone" rules={[{ required: true }]}>
                <Select size="large" options={[
                  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'Asia/Dubai', label: 'Asia/Dubai' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="dateFormat" label="Date Format" rules={[{ required: true }]}>
                <Select size="large" options={[
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" loading={saving} style={{ marginTop: 30 }}>
                  Save System Settings
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

    </div>
  );
};

export default Settings;
