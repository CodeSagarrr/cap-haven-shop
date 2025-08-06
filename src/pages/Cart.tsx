import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';

export const Cart: React.FC = () => {
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Button size="lg" asChild>
          <Link to="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {state.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-xl font-bold text-primary">
                      ₹{item.price.toLocaleString()}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-4 py-2 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({state.itemCount} items):</span>
                <span>₹{state.total.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="text-green-600">
                  {state.total >= 999 ? 'Free' : '₹99'}
                </span>
              </div>
              
              {state.total < 999 && (
                <p className="text-sm text-muted-foreground">
                  Add ₹{(999 - state.total).toLocaleString()} more for free shipping
                </p>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{(state.total + (state.total >= 999 ? 0 : 99)).toLocaleString()}</span>
              </div>
              
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};