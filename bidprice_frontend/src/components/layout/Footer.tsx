import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">BidPrice.gr</h3>
            <p className="text-gray-600">
              Η πιο εύκολη και προσιτή πλατφόρμα δημοπρασιών στην Ελλάδα.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Σύνδεσμοι</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-green-600">
                  Αρχική
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-600 hover:text-green-600">
                  Προϊόντα
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 hover:text-green-600">
                  Σύνδεση
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 hover:text-green-600">
                  Εγγραφή
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Επικοινωνία</h3>
            <p className="text-gray-600">
              Email: info@bidprice.gr
            </p>
            <p className="text-gray-600 mt-2">
              Τηλέφωνο: +30 210 1234567
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} BidPrice.gr - Όλα τα δικαιώματα διατηρούνται.</p>
        </div>
      </div>
    </footer>
  );
};
