import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import { Product } from '../types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, Package, Tag, User, ArrowUp, RefreshCw } from 'lucide-react';

const HomePage: React.FC = () => {
  const { 
    data: products = [] as Product[], 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const data = await productsApi.getAll();
        clearTimeout(timeoutId);
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Failed to fetch products:', err);
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error('Η φόρτωση των προϊόντων έληξε. Παρακαλώ δοκιμάστε ξανά αργότερα.');
        }
        throw new Error('Αποτυχία φόρτωσης προϊόντων. Παρακαλώ δοκιμάστε ξανά αργότερα.');
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

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

    if (days > 0) {
      return `${days} ημέρες, ${hours} ώρες`;
    } else if (hours > 0) {
      return `${hours} ώρες, ${minutes} λεπτά`;
    } else {
      return `${minutes} λεπτά`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center bg-gradient-to-r from-green-50 to-yellow-50 py-14 px-8 rounded-xl shadow-lg border border-green-100 relative overflow-hidden transform hover:shadow-xl transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-yellow-400"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-yellow-200/20 to-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-gradient-to-tr from-green-200/20 to-yellow-200/20 rounded-full blur-3xl"></div>
        <div className="flex justify-center mb-8 transform hover:scale-110 transition-transform duration-500">
          <img src="/images/logo.png" alt="BidPrice.gr Logo" className="h-28 drop-shadow-md" />
        </div>
        <h1 className="text-5xl font-bold mb-6 text-gray-800">Καλωσήρθατε στο <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-yellow-600 animate-gradient-x">BidPrice.gr</span></h1>
        <p className="text-gray-700 max-w-2xl mx-auto text-lg leading-relaxed">
          Η πιο εύκολη και προσιτή πλατφόρμα δημοπρασιών στην Ελλάδα. Βρείτε μοναδικά προϊόντα ή πουλήστε τα δικά σας μέσω δημοπρασίας.
        </p>
        <div className="mt-10">
          <Button asChild variant="primary" size="lg" className="text-lg font-medium">
            <Link to="/products/new">Προσθήκη Προϊόντος</Link>
          </Button>
        </div>
      </div>



      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center border-b pb-4 border-gray-200">
          <Package className="mr-2 text-green-600" />
          Ενεργές Δημοπρασίες
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Ανανέωση
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-green-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Φόρτωση δημοπρασιών...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-lg shadow-md flex items-center space-x-3">
          <div className="bg-red-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Σφάλμα φόρτωσης</h3>
            <p>{error instanceof Error ? error.message : 'Αποτυχία φόρτωσης προϊόντων. Παρακαλώ δοκιμάστε ξανά αργότερα.'}</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-md border border-gray-100">
          <div className="p-8 max-w-md mx-auto">
            <div className="bg-green-50 p-4 rounded-full inline-block mb-6">
              <Package size={48} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-medium mb-3 text-gray-800">Δεν υπάρχουν ενεργές δημοπρασίες</h3>
            <p className="text-gray-600 mb-8 text-lg">Γίνετε ο πρώτος που θα προσθέσει ένα προϊόν προς δημοπρασία!</p>
            <Button asChild variant="primary" size="lg">
              <Link to="/products/new">
                Προσθήκη Προϊόντος
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-gray-200 rounded-xl group">
              {product.image_url ? (
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img 
                    src={product.image_url.startsWith('http') 
                      ? product.image_url 
                      : `${import.meta.env.VITE_API_URL}/uploads/${product.image_url}`}
                    alt={product.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-product.png';
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {product.current_highest_bid && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 text-sm font-medium rounded-bl-lg shadow-md flex items-center">
                      <ArrowUp size={14} className="mr-1.5" />
                      {product.current_highest_bid} €
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-green-50 group-hover:to-green-100 transition-colors duration-500">
                  <Package size={48} className="text-gray-400 group-hover:text-green-500 transition-colors duration-500 transform group-hover:scale-110" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors duration-300">{product.title}</CardTitle>
                <CardDescription className="text-sm text-gray-600 line-clamp-2">
                  {product.description.substring(0, 120)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center text-sm">
                      <Tag className="mr-1 h-4 w-4 text-green-600" /> Τιμή εκκίνησης:
                    </span>
                    <span className="font-medium">{product.starting_price} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center text-sm">
                      <Clock className="mr-1 h-4 w-4 text-green-600" /> Απομένουν:
                    </span>
                    <span className="font-medium text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full shadow-sm">
                      {formatTimeLeft(product.auction_end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center text-sm">
                      <User className="mr-1 h-4 w-4 text-green-600" /> Πωλητής:
                    </span>
                    <span className="font-medium text-sm">ID: {product.seller_id.substring(0, 8)}...</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-gray-100">
                <Button asChild variant="primary" className="w-full">
                  <Link to={`/products/${product.id}`}>Προβολή &amp; Προσφορά</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
