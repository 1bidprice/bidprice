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
    data: products = [], 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const data = await productsApi.getAll();
        return data;
      } catch (err) {
        console.error('Failed to fetch products:', err);
        throw new Error('Failed to load products. Please try again later.');
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
      <div className="mb-12 text-center bg-gradient-to-r from-green-50 to-yellow-50 py-12 px-6 rounded-lg shadow-sm">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="BidPrice.gr Logo" className="h-20" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Καλωσήρθατε στο <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-yellow-600">BidPrice.gr</span></h1>
        <p className="text-gray-700 max-w-2xl mx-auto text-lg">
          Η πιο εύκολη και προσιτή πλατφόρμα δημοπρασιών στην Ελλάδα. Βρείτε μοναδικά προϊόντα ή πουλήστε τα δικά σας μέσω δημοπρασίας.
        </p>
        <div className="mt-8">
          <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-md shadow-md transition-all duration-300 text-lg">
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error instanceof Error ? error.message : 'Failed to load products. Please try again later.'}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg shadow-sm">
          <div className="p-8">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">Δεν υπάρχουν ενεργές δημοπρασίες</h3>
            <p className="text-gray-600 mb-6">Γίνετε ο πρώτος που θα προσθέσει ένα προϊόν προς δημοπρασία!</p>
            <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
              <Link to="/products/new">
                Προσθήκη Προϊόντος
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-gray-200 rounded-xl">
              {product.image_url ? (
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img 
                    src={`${import.meta.env.VITE_API_URL}/${product.image_url}`} 
                    alt={product.title} 
                    className="w-full h-full object-cover"
                  />
                  {product.current_highest_bid && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1 text-sm font-medium rounded-bl-md flex items-center">
                      <ArrowUp size={14} className="mr-1" />
                      {product.current_highest_bid} €
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-center">
                  <Package size={48} className="text-gray-400" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-gray-900 truncate">{product.title}</CardTitle>
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
                    <span className="font-medium text-sm bg-green-50 text-green-700 px-2 py-1 rounded-full">
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
                <Button asChild className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-colors">
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
