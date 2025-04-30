import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productsApi, bidsApi } from '../services/api';
import { Product, Bid } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Package, Gavel, User, CreditCard } from 'lucide-react';
import { TransactionsSection } from '../components/profile/TransactionsSection';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [products, bids] = await Promise.all([
          productsApi.getUserProducts(user.id),
          bidsApi.getUserBids(user.id)
        ]);
        
        setUserProducts(products);
        setUserBids(bids);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuctionStatus = (product: Product) => {
    const end = new Date(product.auction_end_date);
    const now = new Date();
    
    if (end <= now) {
      return product.current_highest_bid ? 'Ολοκληρώθηκε' : 'Έληξε χωρίς προσφορές';
    }
    
    return 'Ενεργή';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <User className="mr-2" />
            Προφίλ Χρήστη
          </CardTitle>
          <CardDescription>
            {user?.username} ({user?.email})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Μέλος από</h3>
              <p className="text-lg">{user?.created_at ? formatDate(user.created_at) : '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Προϊόντα</h3>
              <p className="text-lg">{userProducts.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Προσφορές</h3>
              <p className="text-lg">{userBids.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Τα Προϊόντα μου
          </TabsTrigger>
          <TabsTrigger value="bids" className="flex items-center">
            <Gavel className="mr-2 h-4 w-4" />
            Οι Προσφορές μου
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Συναλλαγές
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Τα Προϊόντα μου</CardTitle>
              <CardDescription>
                Προϊόντα που έχετε καταχωρήσει για δημοπρασία
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Δεν έχετε καταχωρήσει κανένα προϊόν ακόμα.</p>
                  <Button asChild>
                    <Link to="/products/new">Προσθήκη Προϊόντος</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Τίτλος</TableHead>
                      <TableHead>Τιμή Εκκίνησης</TableHead>
                      <TableHead>Τρέχουσα Προσφορά</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                      <TableHead>Λήξη</TableHead>
                      <TableHead>Ενέργειες</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>{product.starting_price.toFixed(2)} €</TableCell>
                        <TableCell>
                          {product.current_highest_bid 
                            ? `${product.current_highest_bid.toFixed(2)} €` 
                            : '-'}
                        </TableCell>
                        <TableCell>{getAuctionStatus(product)}</TableCell>
                        <TableCell>{formatDate(product.auction_end_date)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/products/${product.id}`}>Προβολή</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bids">
          <Card>
            <CardHeader>
              <CardTitle>Οι Προσφορές μου</CardTitle>
              <CardDescription>
                Προσφορές που έχετε υποβάλει σε δημοπρασίες
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userBids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Δεν έχετε υποβάλει καμία προσφορά ακόμα.</p>
                  <Button asChild>
                    <Link to="/">Εξερευνήστε Προϊόντα</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Προϊόν</TableHead>
                      <TableHead>Ποσό Προσφοράς</TableHead>
                      <TableHead>Ημερομηνία</TableHead>
                      <TableHead>Ενέργειες</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userBids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium">
                          {/* We would need to fetch product details for each bid */}
                          Προϊόν #{bid.product_id}
                        </TableCell>
                        <TableCell>{bid.amount.toFixed(2)} €</TableCell>
                        <TableCell>{formatDate(bid.created_at)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/products/${bid.product_id}`}>Προβολή</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};
