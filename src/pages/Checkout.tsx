import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const Checkout: React.FC = () => {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  useEffect(() => {
    if (state.items.length === 0) {
      navigate('/cart');
    }
  }, [state.items.length, navigate]);

  useEffect(() => {
    // Load user profile data if available
    const loadUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            setShippingAddress(prev => ({
              ...prev,
              fullName: data.full_name || '',
              email: data.email || user.email || '',
              phone: data.phone || '',
              address: data.address_line_1 || '',
              city: data.city || '',
              state: data.state || '',
              postalCode: data.postal_code || '',
              country: data.country || 'India',
            }));
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadUserProfile();
  }, [user]);

  const shippingCost = state.total >= 999 ? 0 : 99;
  const totalAmount = state.total + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
    return required.every(field => shippingAddress[field as keyof ShippingAddress].trim() !== '');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      navigate('/auth', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    setIsLoading(true);

    try {
      // Create order in database
      const orderData = {
        user_id: user.id,
        user_email: shippingAddress.email,
        items: state.items as any,
        total_price: totalAmount,
        status: 'pending' as const,
        shipping_address: shippingAddress as any,
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Here you would integrate with Stripe or Razorpay
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', order.id);

      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id.slice(0, 8)} has been confirmed.`,
      });

      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Please sign in to continue</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You need to be signed in to place an order.
        </p>
        <Button size="lg" onClick={() => navigate('/auth', { state: { from: { pathname: '/checkout' } } })}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Shipping Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={shippingAddress.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Place Order"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {state.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.customization?.nickname && (
                          <p className="text-xs text-primary">Custom: "{item.customization.nickname}"</p>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{state.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className={shippingCost === 0 ? "text-green-600" : ""}>
                    {shippingCost === 0 ? 'Free' : `₹${shippingCost}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};