'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, EventDetailResponse } from '@/lib/api/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Calendar, Clock, User, Mail, CreditCard, Package, Award } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PersonalityTestModal } from '@/components/personality-test/PersonalityTestModal';
import { CreateMatchingModal } from '@/components/matching/CreateMatchingModal';
import { matchingApi, MatchingSession } from '@/lib/api/matching';
import { Sparkles, History } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [data, setData] = useState<EventDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [matchingSessions, setMatchingSessions] = useState<MatchingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        setLoading(true);
        const response = await eventsApi.getEventDetail(parseInt(eventId));
        setData(response);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch event details');
        console.error('Error fetching event detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  useEffect(() => {
    const fetchMatchingSessions = async () => {
      if (!eventId) return;
      
      try {
        setLoadingSessions(true);
        const sessions = await matchingApi.getEventSessions(parseInt(eventId));
        setMatchingSessions(sessions);
      } catch (err) {
        console.error('Error fetching matching sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    };

    if (eventId && data) {
      fetchMatchingSessions();
    }
  }, [eventId, data]);

  const handleViewTest = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center space-y-4">
        <p className="text-red-500">{error || 'Event not found'}</p>
        <Button onClick={() => router.push('/dashboard/events')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    );
  }

  const { event, buyers, total_buyers } = data;

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    publish: 'default',
    draft: 'secondary',
    pending: 'outline',
    private: 'destructive',
    trash: 'destructive',
  };

  const orderStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'wc-completed': 'default',
    'wc-processing': 'secondary',
    'wc-pending': 'outline',
    'wc-cancelled': 'destructive',
  };

  return (
    <>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/events')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Event Details</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsMatchingModalOpen(true)}
                  disabled={!data || total_buyers === 0}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Matching
                </Button>
              </div>
              <p className="text-muted-foreground">
                View event information and buyers list
              </p>
            </div>
          </div>
        </div>

        {/* Event Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{event.post_title}</CardTitle>
                <CardDescription>Event ID: #{event.ID}</CardDescription>
              </div>
              <Badge variant={statusVariant[event.post_status] || 'secondary'}>
                {event.post_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Meta Information */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {event.post_date
                      ? format(new Date(event.post_date), 'MMM dd, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Last Modified</p>
                  <p className="font-medium">
                    {event.post_modified
                      ? format(new Date(event.post_modified), 'MMM dd, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Total Buyers</p>
                  <p className="font-medium">{total_buyers}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{event.post_type}</p>
                </div>
              </div>
            </div>

            {/* Event Content */}
            {event.post_excerpt && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Excerpt</h4>
                <p className="text-sm text-muted-foreground">{event.post_excerpt}</p>
              </div>
            )}

            {event.post_content && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Description</h4>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: event.post_content }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {matchingSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Matching History ({matchingSessions.length})
              </CardTitle>
              <CardDescription>
                Previous matching sessions for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {matchingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/events/${eventId}/matching/${session.id}`)}
                  >
                    <div>
                      <p className="font-medium">
                        Session #{session.id} - {session.conversation_style}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View Results
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buyers List Card */}
        <Card>
          <CardHeader>
            <CardTitle>Buyers List ({total_buyers})</CardTitle>
            <CardDescription>
              Users who have purchased this event (Processing & Completed orders only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {buyers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((buyer) => (
                      <TableRow key={`${buyer.user_id}-${buyer.order_id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{buyer.display_name || buyer.user_login}</p>
                              <p className="text-xs text-muted-foreground">
                                @{buyer.user_login}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{buyer.user_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">#{buyer.order_id}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              orderStatusVariant[buyer.order_status] || 'secondary'
                            }
                          >
                            {buyer.order_status.replace('wc-', '')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {buyer.total_amount
                            ? `$${buyer.total_amount.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {buyer.payment_method_title || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {buyer.date_created
                            ? format(new Date(buyer.date_created), 'MMM dd, yyyy HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTest(buyer.user_id, buyer.display_name || buyer.user_login)}
                            disabled={!buyer.has_personality_test}
                            className="flex items-center gap-2"
                          >
                            <Award className="h-4 w-4" />
                            View Test
                          </Button>
                          {!buyer.has_personality_test && (
                            <p className="text-xs text-muted-foreground mt-1">
                              No test completed
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No buyers found for this event
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personality Test Modal */}
      {selectedUserId && (
        <PersonalityTestModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          wpUserId={selectedUserId}
          userName={selectedUserName}
        />
      )}

      {data && (
        <CreateMatchingModal
          open={isMatchingModalOpen}
          onOpenChange={setIsMatchingModalOpen}
          eventId={parseInt(eventId)}
          eventName={event.post_title}
          totalBuyers={total_buyers}
        />
      )}
    </>
  );
}