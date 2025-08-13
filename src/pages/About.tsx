import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
            About CAPSTORE
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Your premier destination for premium quality caps. We believe that the right cap doesn't just protect you from the sun – it expresses your personality and style.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Founded in 2020, CAPSTORE emerged from a simple passion: creating high-quality caps that combine comfort, style, and durability. What started as a small project has grown into a trusted brand that serves customers worldwide.
              </p>
              <p className="text-muted-foreground mb-4">
                We understand that a cap is more than just an accessory – it's a statement. Whether you're looking for a classic baseball cap, a trendy snapback, or a custom design with your nickname, we've got you covered.
              </p>
              <p className="text-muted-foreground">
                Every cap in our collection is carefully selected and crafted to meet our high standards of quality and style.
              </p>
            </div>
            <Card className="p-8">
              <CardContent className="p-0">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary mb-4">Why Choose Us?</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="secondary">Premium Quality</Badge>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="secondary">Custom Personalization</Badge>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="secondary">Fast Shipping</Badge>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="secondary">100% Satisfaction</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-primary mb-3">Quality First</h3>
                <p className="text-muted-foreground">
                  We never compromise on quality. Every cap is made with premium materials and undergoes strict quality control.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-primary mb-3">Customer Satisfaction</h3>
                <p className="text-muted-foreground">
                  Your happiness is our priority. We're committed to providing exceptional service and products that exceed expectations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-primary mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  We continuously innovate our designs and personalization options to keep up with the latest trends and customer needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary mb-8">Meet Our Team</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Behind every great cap is a passionate team dedicated to bringing you the best in headwear fashion and personalization.
          </p>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <p className="text-muted-foreground text-lg">
                Our team consists of experienced designers, quality specialists, and customer service professionals who work together to ensure every CAPSTORE experience is exceptional.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};