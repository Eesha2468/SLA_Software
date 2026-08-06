import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTickets } from "../../hooks/useTickets";
import { Card, Tag, List, Typography, Descriptions, Divider, Space, Button, Form, Input, Select, message, Upload, Row, Col, Alert } from "antd";
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

  const userString = sessionStorage.getItem('user');
  const loggedInUser = (() => {
    try {
      if (!userString) return null;
      const parsed = JSON.parse(userString);
      return typeof parsed === 'object' && parsed ? parsed : null;
    } catch {
      return null;
    }
  })();

  const loadData = async () => {
    try {
      const data = await getTicket(id!);
      if (data) {
        setTicket(data);
        const trailData = await fetchTicketTrail(data.ticket_number);
        setTrail(trailData);

        // Mark as read when ticket details are opened/checked
        if (loggedInUser) {
          await markTicketAsRead(Number(id), loggedInUser.id, loggedInUser.user_type);
          window.dispatchEvent(new Event('unread-count-updated'));
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
    // Refresh trail only every 10 seconds for efficiency
    const interval = setInterval(async () => {
      if (ticket?.ticket_number) {
        const trailData = await fetchTicketTrail(ticket.ticket_number);
        setTrail(trailData);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [id, ticket?.ticket_number]);

  const loggedInUserType = loggedInUser?.user_type;
  const isClientUser = loggedInUserType === 'CLIENT_USER';

  const normalizedStatus = (ticket?.ticket_status || '').trim().toLowerCase();
  const isResolvedOrClosed = ['resolved', 'close', 'closed', 'cancel', 'cancelled'].includes(normalizedStatus);

  const isMyTurnToRespond = isClientUser 
    ? (ticket?.reported_to_type === 'CLIENT_USER') 
    : (ticket?.reported_to_type !== 'CLIENT_USER');

  const handleAddComment = async (values: any) => {
    if (!ticket || isResolvedOrClosed || !isMyTurnToRespond) return;
    setSubmitting(true);
    try {
      // Convert file to base64 if exists
      let attachmentBase64 = null;
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0];

        // Check file size (10MB = 10 * 1024 * 1024 bytes)
        if (file.size > 10 * 1024 * 1024) {
          message.error("File size should not be greater than 10MB");
          setSubmitting(false);
          return;
        }

        attachmentBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
        });
      }

      await updateTicket({
        ticket_id: ticket.ticket_id!,
        ticket_status: values.complaint_action,
        reported_to: ticket.created_by,
        reported_to_type: ticket.created_by_type,
        remarks: values.comment,
        updated_by: loggedInUser?.id,
        updated_by_type: loggedInUser?.user_type || 'USER',
        attachment: attachmentBase64 as string,
      } as any);

      message.success("Response sent back successfully");
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

  const openInNewTab = (dataUrl: string) => {
    if (!dataUrl) return;
    try {
      if (dataUrl.startsWith('data:')) {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(dataUrl, '_blank');
      }
    } catch (e) {
      console.error("Failed to open attachment in new tab:", e);
      const newWin = window.open();
      if (newWin && dataUrl.startsWith('data:image/')) {
        newWin.document.write(`<img src="${dataUrl}" style="max-width:100%;height:auto;" />`);
      } else if (newWin) {
        newWin.location.href = dataUrl;
      }
    }
  };

  const renderAttachment = (base64: string | undefined, fileName: string = "attachment") => {
    if (!base64) return null;
    const isImage = base64.startsWith('data:image/');
    const isVideo = base64.startsWith('data:video/');
    
    if (isImage) {
      return (
        <div style={{ marginTop: 8 }}>
          <img 
            src={base64} 
            alt="attachment" 
            style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 8, cursor: 'pointer', border: '1px solid #d9d9d9' }} 
            onClick={() => openInNewTab(base64)}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div style={{ marginTop: 8 }}>
          <video 
            src={base64} 
            controls 
            style={{ maxWidth: '240px', maxHeight: '180px', borderRadius: 8, cursor: 'pointer', border: '1px solid #d9d9d9' }}
            onClick={() => openInNewTab(base64)}
          />
        </div>
      );
    }

    return (
      <Button 
        type="link" 
        icon={<UploadOutlined />} 
        onClick={() => openInNewTab(base64)}
        style={{ padding: 0 }}
      >
        {fileName || "View Attachment"}
      </Button>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title={
        <Space direction="vertical" size={2}>
          <Title level={3} style={{ margin: 0 }}>{ticket.ticket_number}</Title>
          <Text type="secondary" style={{ fontSize: '15px', fontWeight: 500, color: '#4a5568' }}>
            {ticket.ticket_title || "SLA Fault Report"}
          </Text>
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
          <Descriptions.Item label="Ticket Title" span={2}>
            <Text strong style={{ fontSize: '15px' }}>{ticket.ticket_title || "SLA Fault Report"}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{ticket.ticket_description}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />
        
        <Title level={4}>Add Response</Title>
        {isResolvedOrClosed ? (
          <Alert 
            message="Ticket Status Resolved/Closed"
            description="This ticket is marked as Resolved or Closed. Response sending option is disabled for both sender and receiver."
            type="info" 
            showIcon 
            style={{ marginBottom: 16 }} 
          />
        ) : !isMyTurnToRespond ? (
          <Alert 
            message="Waiting for Response"
            description={`Response sending is currently disabled for your account on this ticket. Waiting for response from ${isClientUser ? 'Service Provider' : 'Client'}.`}
            type="warning" 
            showIcon 
            style={{ marginBottom: 16 }} 
          />
        ) : (
          <Form form={form} layout="vertical" onFinish={handleAddComment}>
            <Form.Item name="comment" rules={[{ required: true, message: 'Please enter your comment' }]}>
              <TextArea rows={3} placeholder="Write your response here..." disabled={submitting || isResolvedOrClosed || !isMyTurnToRespond} />
            </Form.Item>
            
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
              <Col flex="auto">
                <Upload 
                  beforeUpload={() => false} 
                  maxCount={1}
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  disabled={submitting || isResolvedOrClosed || !isMyTurnToRespond}
                >
                  <Button icon={<UploadOutlined />} disabled={submitting || isResolvedOrClosed || !isMyTurnToRespond}>Attach File</Button>
                </Upload>
              </Col>
            </Row>

            <Row justify="space-between" align="bottom" style={{ marginBottom: 0 }}>
              <Col>
                <Form.Item 
                  name="complaint_action" 
                  label="Ticket Action" 
                  rules={[{ required: true, message: 'Please select a Ticket Action option before sending response' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select placeholder="Select Ticket Action" size="large" style={{ width: 260 }} disabled={submitting || isResolvedOrClosed || !isMyTurnToRespond}>
                    <Select.Option value="Open">Open</Select.Option>
                    <Select.Option value="Resolved">Resolve</Select.Option>
                    <Select.Option value="Cancel">Cancel</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting} disabled={submitting || isResolvedOrClosed || !isMyTurnToRespond} size="large">
                  Send Response
                </Button>
              </Col>
            </Row>
          </Form>
        )}

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