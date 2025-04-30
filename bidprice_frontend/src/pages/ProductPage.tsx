import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, bidsApi } from '../services/api';
import { Product, Bid } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Clock, AlertTriangle, Package, Tag, User as UserIcon, ArrowUp, Calendar } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from '../components/ui/alert';

export const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!productId) return;

    let isMounted = true;
    
    const fetchProductData = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      let productFetched = false;
      let bidsFetched = false;
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching product data for ID:', productId);
        
        console.log('Setting up product fetch timeout');
        timeoutId = setTimeout(() => {
          console.log('TIMEOUT TRIGGERED: Product fetch timeout reached after 10 seconds');
          if (isMounted) {
            setLoading(false);
            if (!productFetched) {
              setError('Το αίτημα για το προϊόν έληξε. Παρακαλώ δοκιμάστε ξανά αργότερα.');
            } else if (!bidsFetched) {
              setError('Το αίτημα για τις προσφορές έληξε. Το προϊόν φορτώθηκε αλλά οι προσφορές όχι.');
            }
          }
        }, 10000); // 10 second timeout
        
        try {
          const productData = await productsApi.getById(productId);
          console.log('Product data received:', productData);
          
          if (isMounted) {
            setProduct(productData);
            productFetched = true;
            
            try {
              const bidsData = await bidsApi.getForProduct(productId);
              console.log('Bids data received:', bidsData);
              
              if (isMounted) {
                setBids(bidsData.sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ));
                bidsFetched = true;
              }
            } catch (bidsErr: any) {
              console.error('Failed to fetch bids data:', bidsErr);
            }
          }
        } catch (productErr: any) {
          console.error('Failed to fetch product data:', productErr);
          if (isMounted) {
            setError(productErr.message || 'Αποτυχία φόρτωσης προϊόντος. Παρακαλώ δοκιμάστε ξανά αργότερα.');
          }
        }
      } catch (err: any) {
        console.error('Unexpected error in fetchProductData:', err);
        if (isMounted) {
          setError('Σφάλμα φόρτωσης δεδομένων. Παρακαλώ δοκιμάστε ξανά αργότερα.');
        }
      } finally {
        if (timeoutId && (productFetched || error)) {
          clearTimeout(timeoutId);
        }
        
        if (isMounted && (productFetched || error)) {
          setLoading(false);
        }
      }
    };

    fetchProductData();
    
    return () => {
      isMounted = false;
    };
  }, [productId]); // Only depend on productId
  
  useEffect(() => {
    if (!product || !product.auction_end_date) return;
    
    const updateTimeLeft = () => {
      setTimeLeft(formatTimeLeft(product.auction_end_date));
    };
    
    updateTimeLeft();
    
    const timer = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [product?.auction_end_date]); // Only depend on auction_end_date, not the entire product object

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Έληξε';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days} ημέρες, ${hours} ώρες`;
    } else if (hours > 0) {
      return `${hours} ώρες, ${minutes} λεπτά`;
    } else if (minutes > 0) {
      return `${minutes} λεπτά, ${seconds} δευτερόλεπτα`;
    } else {
      return `${seconds} δευτερόλεπτα`;
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!productId || !product) return;
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      setBidError('Παρακαλώ εισάγετε έγκυρο ποσό.');
      return;
    }
    
    const minBid = product.current_highest_bid 
      ? product.current_highest_bid + 0.01 
      : product.starting_price;
    
    if (amount < minBid) {
      setBidError(`Η προσφορά πρέπει να είναι τουλάχιστον ${minBid.toFixed(2)} €.`);
      return;
    }
    
    const loadingTimeout = setTimeout(() => {
      if (bidLoading) {
        setBidLoading(false);
        setBidError('Η προσφορά καθυστερεί. Παρακαλώ δοκιμάστε ξανά αργότερα.');
      }
    }, 15000); // 15 seconds timeout
    
    try {
      setBidLoading(true);
      setBidError(null);
      
      const newBid = await bidsApi.create(productId, amount);
      
      const updatedProduct = await productsApi.getById(productId);
      setProduct(updatedProduct);
      
      setBids([newBid, ...bids]);
      setBidAmount('');
      
      clearTimeout(loadingTimeout);
      
    } catch (err: any) {
      console.error('Failed to place bid:', err);
      setBidError(err.message || 'Αποτυχία υποβολής προσφοράς. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setBidLoading(false);
      clearTimeout(loadingTimeout);
    }
  };

  const isAuctionEnded = () => {
    if (!product) return false;
    const end = new Date(product.auction_end_date);
    const now = new Date();
    return end <= now;
  };

  const canPlaceBid = () => {
    if (!isAuthenticated || !product || !user) return false;
    if (isAuctionEnded()) return false;
    if (product.seller_id === user.id) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-green-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Φόρτωση προϊόντος...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Σφάλμα</AlertTitle>
          <AlertDescription>
            {error || 'Το προϊόν δεν βρέθηκε.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl transform hover:-translate-y-1">
            {product.image_url ? (
              <div className="relative h-64 md:h-80 overflow-hidden bg-gray-100 border-b border-gray-200">
                <img 
                  src={product.image_url.startsWith('http') 
                    ? product.image_url 
                    : `${import.meta.env.VITE_API_URL}/uploads/${product.image_url}`}
                  alt={product.title} 
                  className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    console.log('Image failed to load:', product.image_url);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDEyOEMxMTcuNjczIDEyOCAxMzIgMTEzLjY3MyAxMzIgOTZDMTMyIDc4LjMyNyAxMTcuNjczIDY0IDEwMCA2NEM4Mi4zMjcgNjQgNjggNzguMzI3IDY4IDk2QzY4IDExMy42NzMgODIuMzI3IDEyOCAxMDAgMTI4WiIgZmlsbD0iIzk0QTNCOCIvPjxwYXRoIGQ9Ik0xNjAgMTY4SDQwQzQwIDE1MS40MzEgNTMuNDMxIDEzOCA3MCAxMzhIMTMwQzE0Ni41NjkgMTM4IDE2MCAxNTEuNDMxIDE2MCAxNjhaIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';
                    e.currentTarget.onerror = null;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                {product.current_highest_bid && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 text-sm font-medium rounded-bl-lg shadow-md flex items-center">
                    <ArrowUp size={14} className="mr-1.5" />
                    {product.current_highest_bid.toFixed(2)} €
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-r from-green-50 to-gray-100 flex items-center justify-center border-b border-gray-200 hover:bg-gradient-to-r hover:from-green-100 hover:to-gray-200 transition-colors duration-500">
                <Package size={64} className="text-gray-400 hover:text-green-500 transition-colors duration-500 transform hover:scale-110" />
              </div>
            )}
            <CardHeader className="pb-3 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
              <CardTitle className="text-3xl text-gray-800 font-bold leading-tight">{product.title}</CardTitle>
              <CardDescription className="flex items-center text-sm mt-3">
                <Clock className="mr-2 h-5 w-5 text-green-600" />
                {isAuctionEnded() ? (
                  <span className="text-red-500 font-medium bg-red-50 px-3 py-1.5 rounded-full shadow-sm border border-red-100">
                    Η δημοπρασία έχει λήξει
                  </span>
                ) : (
                  <span className="text-green-700 bg-green-50 px-3 py-1.5 rounded-full font-medium shadow-sm border border-green-100">
                    Απομένουν: {timeLeft || formatTimeLeft(product.auction_end_date)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-white p-5 rounded-xl border border-green-100 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center border-b pb-2 border-green-100">
                    <Tag className="mr-2 text-green-600" size={18} />
                    Πληροφορίες Προϊόντος
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <Tag className="mr-1.5 h-4 w-4 text-green-600" /> Τιμή εκκίνησης
                      </h4>
                      <p className="text-xl font-bold text-gray-900">{product.starting_price.toFixed(2)} €</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <ArrowUp className="mr-1.5 h-4 w-4 text-green-600" /> Τρέχουσα προσφορά
                      </h4>
                      <p className="text-xl font-bold text-green-600">
                        {product.current_highest_bid 
                          ? `${product.current_highest_bid.toFixed(2)} €` 
                          : 'Καμία προσφορά'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <Calendar className="mr-1.5 h-4 w-4 text-green-600" /> Ημερομηνία λήξης
                      </h4>
                      <p className="text-sm font-medium bg-gray-50 px-2 py-1 rounded-md inline-block">
                        {new Date(product.auction_end_date).toLocaleString('el-GR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <UserIcon className="mr-1.5 h-4 w-4 text-green-600" /> Πωλητής
                      </h4>
                      <p className="text-sm font-medium bg-gray-50 px-2 py-1 rounded-md inline-block">
                        ID: {product.seller_id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-800 border-b pb-2 border-gray-200">Περιγραφή</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{product.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canPlaceBid() && (
            <Card className="mt-6 border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
                <CardTitle className="text-gray-800 flex items-center">
                  <ArrowUp className="mr-2 text-green-600" size={18} />
                  Υποβολή Προσφοράς
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {bidError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Σφάλμα</AlertTitle>
                    <AlertDescription>{bidError}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-md text-sm text-green-700 mb-2 border border-green-100">
                    <p>Ελάχιστη προσφορά: <span className="font-bold">{
                      product.current_highest_bid 
                        ? (product.current_highest_bid + 0.01).toFixed(2) 
                        : product.starting_price.toFixed(2)
                    } €</span></p>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-grow">
                      <Input
                        type="number"
                        step="0.01"
                        min={product.current_highest_bid ? product.current_highest_bid + 0.01 : product.starting_price}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Εισάγετε το ποσό προσφοράς σας"
                        className="border-green-200 focus:border-green-400"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={bidLoading}
                      className="relative"
                    >
                      {bidLoading ? (
                        <>
                          <span className="opacity-0">Υποβολή Προσφοράς</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          </div>
                        </>
                      ) : 'Υποβολή Προσφοράς'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isAuthenticated && product.seller_id === user?.id && (
            <Alert className="mt-6 border border-green-100 bg-green-50">
              <AlertTitle className="text-gray-800 font-medium">Σημείωση</AlertTitle>
              <AlertDescription className="text-green-700">
                Αυτό είναι το δικό σας προϊόν, οπότε δεν μπορείτε να υποβάλετε προσφορά.
              </AlertDescription>
            </Alert>
          )}

          {!isAuthenticated && (
            <Alert className="mt-6 border border-green-100 bg-green-50">
              <AlertTitle className="text-gray-800 font-medium">Σημείωση</AlertTitle>
              <AlertDescription className="text-green-700">
                Πρέπει να <Button variant="link" onClick={() => navigate('/login')} className="p-0 text-green-600 hover:text-green-800">συνδεθείτε</Button> για να υποβάλετε προσφορά.
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && isAuctionEnded() && product.current_highest_bidder_id === user?.id && (
            <Card className="mt-6 border-green-200 shadow-md hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
                <CardTitle className="text-gray-800">Συγχαρητήρια! Κερδίσατε τη δημοπρασία</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-gray-700 mb-4">
                  Είστε ο νικητής της δημοπρασίας! Μπορείτε τώρα να προχωρήσετε στην πληρωμή για να ολοκληρώσετε την αγορά σας.
                </p>
                <Button 
                  onClick={() => navigate(`/payment/${product.id}`)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  Προχωρήστε σε Πληρωμή
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
              <CardTitle className="text-gray-800 flex items-center">
                <Clock className="mr-2 text-green-600" size={18} />
                Ιστορικό Προσφορών
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 bg-gradient-to-b from-gray-50 to-white">
                  <div className="bg-green-50 p-4 rounded-full mb-4">
                    <Package size={32} className="text-green-500" />
                  </div>
                  <p className="text-gray-700 text-center font-medium">Δεν υπάρχουν προσφορές ακόμα.</p>
                  <p className="text-gray-500 text-sm text-center mt-2 max-w-xs">Γίνετε ο πρώτος που θα υποβάλει προσφορά και αποκτήστε αυτό το μοναδικό προϊόν!</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-green-700">Ποσό</TableHead>
                        <TableHead className="text-green-700">Ημερομηνία</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.map((bid) => (
                        <TableRow key={bid.id} className="hover:bg-green-50 transition-colors">
                          <TableCell className="font-medium text-green-600">{bid.amount.toFixed(2)} €</TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {new Date(bid.created_at).toLocaleString('el-GR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 border-t border-gray-100 py-3 px-4">
              <p className="text-xs text-gray-500 w-full text-center">
                Οι προσφορές εμφανίζονται με χρονολογική σειρά (νεότερες πρώτα)
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
