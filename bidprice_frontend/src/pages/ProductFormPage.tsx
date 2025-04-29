import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../services/api';
import { ProductFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertTriangle, Package, Upload, X } from 'lucide-react';

export const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    starting_price: 0,
    auction_end_date: '',
    image_url: undefined,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'starting_price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Το μέγεθος της εικόνας δεν πρέπει να ξεπερνά τα 5MB.');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Μη αποδεκτός τύπος αρχείου. Επιτρέπονται μόνο JPG, PNG και GIF.');
      return;
    }
    
    try {
      setUploadingImage(true);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      const response = await productsApi.uploadImage(file);
      
      setFormData(prev => ({
        ...prev,
        image_url: response.file_path
      }));
      
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.message || 'Αποτυχία ανεβάσματος εικόνας. Παρακαλώ δοκιμάστε ξανά.');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image_url: undefined
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Παρακαλώ εισάγετε τίτλο για το προϊόν.');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Παρακαλώ εισάγετε περιγραφή για το προϊόν.');
      return;
    }
    
    if (formData.starting_price <= 0) {
      setError('Η τιμή εκκίνησης πρέπει να είναι μεγαλύτερη από 0.');
      return;
    }
    
    if (!formData.auction_end_date) {
      setError('Παρακαλώ επιλέξτε ημερομηνία λήξης της δημοπρασίας.');
      return;
    }
    
    const endDate = new Date(formData.auction_end_date);
    if (endDate <= new Date()) {
      setError('Η ημερομηνία λήξης πρέπει να είναι στο μέλλον.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await productsApi.create(formData);
      
      alert('Το προϊόν δημιουργήθηκε επιτυχώς!');
      
      setLoading(false);
      
      navigate('/');
    } catch (err: any) {
      console.error('Failed to create product:', err);
      setError(err.message || 'Αποτυχία δημιουργίας προϊόντος. Παρακαλώ δοκιμάστε ξανά.');
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Προσθήκη Νέου Προϊόντος</h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          Δημιουργήστε μια νέα δημοπρασία και αφήστε τους χρήστες να υποβάλουν προσφορές για το προϊόν σας.
        </p>
      </div>
      <Card className="max-w-2xl mx-auto border border-gray-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <CardTitle className="flex items-center text-2xl text-gray-800">
            <Package className="mr-2 text-green-600" />
            Στοιχεία Προϊόντος
          </CardTitle>
          <CardDescription>
            Συμπληρώστε τα παρακάτω στοιχεία για να προσθέσετε ένα νέο προϊόν προς δημοπρασία.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Σφάλμα</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Τίτλος Προϊόντος</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="π.χ. iPhone 13 Pro Max"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Περιγραφή</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Περιγράψτε το προϊόν σας με λεπτομέρειες..."
                rows={5}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="starting_price">Τιμή Εκκίνησης (€)</Label>
              <Input
                id="starting_price"
                name="starting_price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.starting_price || ''}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auction_end_date">Ημερομηνία Λήξης Δημοπρασίας</Label>
              <Input
                id="auction_end_date"
                name="auction_end_date"
                type="datetime-local"
                min={minDate}
                value={formData.auction_end_date}
                onChange={handleInputChange}
                required
              />
              <p className="text-sm text-gray-500">
                Επιλέξτε πότε θα λήξει η δημοπρασία. Πρέπει να είναι τουλάχιστον μία ημέρα από σήμερα.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product_image">Εικόνα Προϊόντος</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || loading}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  {uploadingImage ? 'Ανέβασμα...' : 'Επιλογή Εικόνας'}
                </Button>
                <Input
                  id="product_image"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  disabled={uploadingImage || loading}
                />
                <p className="text-sm text-gray-500">
                  Προτεινόμενο μέγεθος: 800x600px, μέγιστο μέγεθος: 5MB
                </p>
              </div>
              
              {imagePreview && (
                <div className="relative mt-4 w-full max-w-md">
                  <div className="relative rounded-md overflow-hidden border border-gray-200">
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      className="w-full h-auto object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading || uploadingImage}
              >
                Ακύρωση
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploadingImage}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white relative"
              >
                {loading ? (
                  <>
                    <span className="opacity-0">Δημιουργία Προϊόντος</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  </>
                ) : 'Δημιουργία Προϊόντος'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
