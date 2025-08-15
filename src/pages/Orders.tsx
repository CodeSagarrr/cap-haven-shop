import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Package, Calendar, CreditCard, MapPin } from 'lucide-react';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image_url: string;
  customization?: {
    nickname?: string;
  };
}

interface Order {
  id: string;
  user_email: string;
  items: OrderItem[];
  shipping_address: any;
  total_price: number;
  status: string;
  created_at: string;
  stripe_session_id?: string;
}

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load your orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Please sign in to view orders</h1>
        <p className="text-lg text-muted-foreground">
          You need to be signed in to view your order history.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Package className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Your Orders</h1>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              When you place your first order, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>Order #{order.id.slice(-8).toUpperCase()}</span>
                      {getStatusBadge(order.status)}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ₹{order.total_price.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      {order.stripe_session_id ? 'Online Payment' : 'Payment Pending'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Items */}
                <div>
                  <h4 className="font-semibold mb-3">Items Ordered</h4>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium">{item.title}</h5>
                          {item.customization?.nickname && (
                            <p className="text-sm text-primary">
                              Custom Text: "{item.customization.nickname}"
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} • ₹{item.price.toLocaleString()} each
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Shipping Address */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="font-medium">{order.shipping_address?.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address?.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address?.country}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Phone: {order.shipping_address?.phone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};