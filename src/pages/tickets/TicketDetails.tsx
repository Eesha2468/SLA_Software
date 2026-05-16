import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTickets } from "../../hooks/useTickets";
import { Card, Tag, List, Typography, Descriptions, Divider, Space, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { TicketDTO, fetchTicketTrail, TicketTrailDTO, markTicketAsRead } from "../../api/ticketApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const TicketDetails: React.FC = () => {
  const { id } = useParams();
  const { getTicket } = useTickets();
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [trail, setTrail] = useState<TicketTrailDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const userString = localStorage.getItem('user');
  const loggedInUser = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    const load = async () => {
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
    load();
  }, [id, getTicket, loggedInUser?.id]);

  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;

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