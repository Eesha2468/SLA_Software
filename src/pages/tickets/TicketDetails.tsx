import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTickets } from "../../hooks/useTickets";
import { Card, Tag, List, Typography, Descriptions, Divider, Space, Button, Form, Input, message, Upload, Row, Col } from "antd";
import { UploadOutlined, SendOutlined } from "@ant-design/icons";
import { TicketDTO, fetchTicketTrail, TicketTrailDTO, markTicketAsRead } from "../../api/ticketApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const TicketDetails: React.FC = () => {
  const { id } = useParams();
  const { getTicket, updateTicket } = useTickets();
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [trail, setTrail] = useState<TicketTrailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [form] = Form.useForm();

  const userString = localStorage.getItem('user');
  const loggedInUser = userString ? JSON.parse(userString) : null;

  const loadData = async () => {
    try {
      const data = await getTicket(id!);
      if (data) {
        setTicket(data);
        const trailData = await fetchTicketTrail(data.ticket_number);
        setTrail(trailData);

        // Mark as read if I am the receiver
        if (loggedInUser && String(data.reported_to) === String(loggedInUser.id)) {
          await markTicketAsRead(Number(id), loggedInUser.id, loggedInUser.user_type);
        }
      }
    } catch (error) {
      console.error("Failed to load ticket details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-time trail refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [id, loggedInUser?.id]);

  const handleAddComment = async (values: any) => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      // Convert file to base64 if exists
      let attachmentBase64 = null;
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0];
        attachmentBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
        });
      }

      await updateTicket({
        ticket_id: ticket.ticket_id!,
        remarks: values.comment,
        updated_by: loggedInUser?.id,
        updated_by_type: loggedInUser?.user_type || 'regular',
        attachment: attachmentBase64 as string,
      } as any);

      message.success("Response added successfully");
      form.resetFields();
      setFileList([]);
      await loadData();
    } catch (error: any) {
      message.error(error.message || "Failed to add response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !ticket) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!ticket) return <div style={{ padding: 24 }}>Ticket not found</div>;

  const renderAttachment = (base64: string | undefined, fileName: string = "attachment") => {
    if (!base64) return null;
    const isImage = base64.startsWith('data:image/');
    
    if (isImage) {
      return (
        <div style={{ marginTop: 8 }}>
          <img 
            src={base64} 
            alt="attachment" 
            style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 8, cursor: 'pointer', border: '1px solid #d9d9d9' }} 
            onClick={() => window.open(base64, '_blank')}
          />
        </div>
      );
    }

    return (
      <Button 
        type="link" 
        icon={<UploadOutlined />} 
        onClick={() => {
          const link = document.createElement('a');
          link.href = base64;
          link.download = fileName;
          link.click();
        }}
        style={{ padding: 0 }}
      >
        Download Attachment
      </Button>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title={
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0 }}>{ticket.ticket_number}</Title>
          <Text type="secondary">{ticket.ticket_title}</Text>
        </Space>
      }>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Status">
            <Tag color={ticket.ticket_status === 'Open' ? 'blue' : 'success'}>
              {ticket.ticket_status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Service Provider">{ticket.sp_name}</Descriptions.Item>
          <Descriptions.Item label="Line">{ticket.line_name}</Descriptions.Item>
          <Descriptions.Item label="KPI Category">{ticket.main_category_name}</Descriptions.Item>
          <Descriptions.Item label="KPI Sub-Category">{ticket.sub_category_name}</Descriptions.Item>
          <Descriptions.Item label="Created By">{ticket.creator_name}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {dayjs(ticket.created_at).format("MMM DD, YYYY HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Attachment">
            {renderAttachment(ticket.attachment, `ticket_${ticket.ticket_number}_file`)}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{ticket.ticket_description}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />
        
        <Title level={4}>Add Response</Title>
        <Form form={form} layout="vertical" onFinish={handleAddComment}>
          <Form.Item name="comment" rules={[{ required: true, message: 'Please enter your comment' }]}>
            <TextArea rows={3} placeholder="Write your response here..." />
          </Form.Item>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Upload 
                beforeUpload={() => false} 
                maxCount={1}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
              >
                <Button icon={<UploadOutlined />}>Attach File</Button>
              </Upload>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting}>
                Send Response
              </Button>
            </Col>
          </Row>
        </Form>

        <h3 style={{ marginTop: 24 }}>Ticket Trail / History</h3>
        <List
          dataSource={trail}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Text strong style={{ fontSize: '15px' }}>{item.comment}</Text>}
                description={
                  <div style={{ marginTop: 4 }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          By: <Text strong>{item.creator_name}</Text>
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Date: {dayjs(item.created_at).format("MMM DD, YYYY HH:mm:ss")}
                        </Text>
                      </Space>
                      {renderAttachment(item.attachment, `trail_attachment_${item.guid}`)}
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default TicketDetails;