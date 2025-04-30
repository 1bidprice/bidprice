import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, paymentsApi } from '../services/api';
import { Product, PaymentFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from '../components/ui/alert';
import { CreditCard, AlertTriangle, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const paymentSchema = z.object({
  payment_method: z.enum(['credit_card', 'bank_transfer', 'paypal'], {
    required_error: "Παρακαλώ επιλέξτε μέθοδο πληρωμής",
  }),
});

export const PaymentPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_method: 'credit_card',
    },
  });
  
  useEffect(() => {
    if (!productId || !isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await productsApi.getById(productId);
        
        if (productData.is_active) {
          setError('Η δημοπρασία είναι ακόμα ενεργή. Δεν μπορείτε να προχωρήσετε σε πληρωμή.');
          setLoading(false);
          return;
        }
        
        if (productData.current_highest_bidder_id !== user?.id) {
          setError('Μόνο ο υψηλότερος πλειοδότης μπορεί να προχωρήσει σε πληρωμή.');
          setLoading(false);
          return;
        }
        
        setProduct(productData);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Δεν ήταν δυνατή η φόρτωση του προϊόντος. Παρακαλώ δοκιμάστε ξανά αργότερα.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, isAuthenticated, navigate, user]);
  
  const onSubmit = async (data: z.infer<typeof paymentSchema>) => {
    if (!product || !productId) return;
    
    setPaymentLoading(true);
    setError(null);
    
    try {
      const paymentData: PaymentFormData = {
        product_id: productId,
        payment_method: data.payment_method,
      };
      
      await paymentsApi.create(paymentData);
      setPaymentSuccess(true);
      
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
      
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Σφάλμα κατά την επεξεργασία της πληρωμής. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setPaymentLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Σφάλμα</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate(-1)}>Επιστροφή</Button>
        </div>
      </div>
    );
  }
  
  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Επιτυχία</AlertTitle>
          <AlertDescription>Η πληρωμή σας έγινε με επιτυχία! Ανακατεύθυνση στο προφίλ σας...</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card className="border-green-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
            <CardTitle className="text-gray-800 flex items-center">
              <CreditCard className="mr-2 text-green-600" size={18} />
              Πληρωμή
            </CardTitle>
            <CardDescription>
              Ολοκληρώστε την πληρωμή για το προϊόν που κερδίσατε
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {product && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                <p className="text-gray-600 text-sm">{product.description.substring(0, 100)}...</p>
                <div className="mt-2 font-medium">
                  Ποσό πληρωμής: <span className="text-green-600">{(product.current_highest_bid || product.starting_price).toFixed(2)} €</span>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Μέθοδος Πληρωμής</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Επιλέξτε μέθοδο πληρωμής" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit_card">Πιστωτική κάρτα</SelectItem>
                          <SelectItem value="bank_transfer">Τραπεζική μεταφορά</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Επιλέξτε τον τρόπο με τον οποίο θέλετε να πληρώσετε
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Επεξεργασία...
                    </div>
                  ) : (
                    <>Ολοκλήρωση Πληρωμής</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
