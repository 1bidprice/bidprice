import React, { useState, useEffect } from 'react';
import { paymentsApi } from '../../services/api';
import { Transaction } from '../../types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { CreditCard, TrendingUp, ShoppingBag, Tag } from 'lucide-react';

export const TransactionsSection: React.FC = () => {
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        const [purchasesData, salesData] = await Promise.all([
          paymentsApi.getUserPurchases(),
          paymentsApi.getUserSales()
        ]);
        
        setPurchases(purchasesData);
        setSales(salesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Δεν ήταν δυνατή η φόρτωση των συναλλαγών. Παρακαλώ δοκιμάστε ξανά αργότερα.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, text: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Σε εκκρεμότητα' },
      'completed': { color: 'bg-green-100 text-green-800 border-green-200', text: 'Ολοκληρώθηκε' },
      'failed': { color: 'bg-red-100 text-red-800 border-red-200', text: 'Απέτυχε' },
      'refunded': { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Επιστροφή χρημάτων' }
    };
    
    const { color, text } = statusMap[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
        {text}
      </span>
    );
  };
  
  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, { icon: JSX.Element, text: string }> = {
      'credit_card': { 
        icon: <CreditCard className="h-4 w-4 mr-1.5 text-blue-600" />, 
        text: 'Πιστωτική κάρτα' 
      },
      'bank_transfer': { 
        icon: <TrendingUp className="h-4 w-4 mr-1.5 text-green-600" />, 
        text: 'Τραπεζική μεταφορά' 
      },
      'paypal': { 
        icon: <ShoppingBag className="h-4 w-4 mr-1.5 text-blue-600" />, 
        text: 'PayPal' 
      }
    };
    
    const { icon, text } = methodMap[method] || { 
      icon: <Tag className="h-4 w-4 mr-1.5 text-gray-600" />, 
      text: method 
    };
    
    return (
      <div className="flex items-center">
        {icon}
        <span>{text}</span>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }
  
  return (
    <Card className="border-gray-200 shadow-md">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <CardTitle className="text-gray-800 flex items-center">
          <CreditCard className="mr-2 text-green-600" size={18} />
          Συναλλαγές
        </CardTitle>
        <CardDescription>
          Διαχειριστείτε τις αγορές και τις πωλήσεις σας
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="purchases">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="purchases">Αγορές</TabsTrigger>
            <TabsTrigger value="sales">Πωλήσεις</TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchases">
            {purchases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="bg-green-50 p-4 rounded-full mb-4">
                    <ShoppingBag size={32} className="text-green-500" />
                  </div>
                  <p className="text-gray-700 font-medium">Δεν έχετε πραγματοποιήσει αγορές ακόμα.</p>
                  <p className="text-gray-500 text-sm mt-2 max-w-xs text-center">
                    Όταν κερδίσετε μια δημοπρασία και ολοκληρώσετε την πληρωμή, οι αγορές σας θα εμφανίζονται εδώ.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ημερομηνία</TableHead>
                      <TableHead>Ποσό</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                      <TableHead>Μέθοδος</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-green-50 transition-colors">
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell className="font-medium">{transaction.amount.toFixed(2)} €</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>{formatPaymentMethod(transaction.payment_method)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sales">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="bg-green-50 p-4 rounded-full mb-4">
                    <Tag size={32} className="text-green-500" />
                  </div>
                  <p className="text-gray-700 font-medium">Δεν έχετε πραγματοποιήσει πωλήσεις ακόμα.</p>
                  <p className="text-gray-500 text-sm mt-2 max-w-xs text-center">
                    Όταν κάποιος κερδίσει μια δημοπρασία σας και ολοκληρώσει την πληρωμή, οι πωλήσεις σας θα εμφανίζονται εδώ.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ημερομηνία</TableHead>
                      <TableHead>Ποσό</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                      <TableHead>Προμήθεια</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-green-50 transition-colors">
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell className="font-medium">{transaction.amount.toFixed(2)} €</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-red-600">-{transaction.transaction_fee.toFixed(2)} €</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TransactionsSection;
