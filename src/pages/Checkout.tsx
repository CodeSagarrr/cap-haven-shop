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
import { RazorpayIntegration } from '@/utils/razorpay-integration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
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

  const createOrder = async (paymentStatus: 'paid' | 'pending', paymentId?: string) => {
    try {
      // Create order in Supabase
      const orderData = {
        user_id: user?.id,
        user_email: shippingAddress.email,
        items: state.items as any,
        shipping_address: shippingAddress as any,
        total_price: totalAmount,
        status: paymentStatus,
        stripe_session_id: paymentId || null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order');
      }

      // Send email notification to admin
      try {
        const emailData = {
          orderId: order.id,
          customerName: shippingAddress.fullName,
          customerEmail: shippingAddress.email,
          customerPhone: shippingAddress.phone,
          shippingAddress: {
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
          },
          paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery (COD)',
          paymentStatus: paymentStatus === 'paid' ? 'Paid' : 'Pending',
          orderDateTime: order.created_at,
          items: state.items,
          totalAmount,
        };

        const { error: emailError } = await supabase.functions.invoke('send-order-email', {
          body: emailData,
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't throw error here as order is already created
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Continue with order completion even if email fails
      }

      return order.id;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  };

  const handleRazorpayPayment = async () => {
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

    // Prepare order data
    const orderData = {
      user_id: user.id,
      user_email: shippingAddress.email,
      items: state.items,
      shipping_address: shippingAddress,
      total_price: totalAmount,
    };

    // Use the new Razorpay integration
    await RazorpayIntegration.processPayment({
      amount: totalAmount,
      user,
      orderData,
      onSuccess: async (orderId: string, paymentId: string) => {
        try {
          // Order is already created in Razorpay integration, just send email
          const emailData = {
            orderId,
            customerName: shippingAddress.fullName,
            customerEmail: shippingAddress.email,
            customerPhone: shippingAddress.phone,
            shippingAddress: {
              address: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country,
            },
            paymentMethod: 'Razorpay',
            paymentStatus: 'Paid',
            orderDateTime: new Date().toISOString(),
            items: state.items,
            totalAmount,
          };

          const { error: emailError } = await supabase.functions.invoke('send-order-email', {
            body: emailData,
          });

          if (emailError) {
            console.error('Email sending failed:', emailError);
          }
        } catch (error) {
          console.error('Post-payment processing error:', error);
        }

        clearCart();
        toast({
          title: "Payment Successful!",
          description: "Your order has been confirmed and payment processed.",
        });
        navigate(`/order-confirmation?order_id=${orderId}&payment_id=${paymentId}`);
        setIsLoading(false);
      },
      onError: (error: string) => {
        toast({
          title: "Payment Failed",
          description: error,
          variant: "destructive",
        });
        setIsLoading(false);
      },
    });
  };

  const handleCODOrder = async () => {
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
      const orderId = await createOrder('pending');
      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: "Your COD order has been confirmed. Pay when you receive your items.",
      });
      navigate(`/order-confirmation?order_id=${orderId}&payment_method=cod`);
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment();
    } else {
      handleCODOrder();
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
                
                {/* Payment Method Selection */}
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'razorpay' | 'cod') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="razorpay">💳 Pay Online (Razorpay)</SelectItem>
                      <SelectItem value="cod">💵 Cash on Delivery (COD)</SelectItem>
                    </SelectContent>
                  </Select>
                  {paymentMethod === 'cod' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Pay when you receive your order. COD charges may apply.
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : (
                    paymentMethod === 'razorpay' ? "Pay Now" : "Place COD Order"
                  )}
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