import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  slug: string;
  is_featured?: boolean;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
    });

    toast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast({
      title: "Added to wishlist",
      description: `${product.title} has been added to your wishlist.`,
    });
  };

  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in">
      <Link to={`/product/${product.slug}`}>
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex space-x-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full"
                  onClick={handleWishlist}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Featured badge */}
            {product.is_featured && (
              <Badge 
                variant="destructive" 
                className="absolute top-3 left-3"
              >
                Featured
              </Badge>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                ₹{product.price.toLocaleString()}
              </span>
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};