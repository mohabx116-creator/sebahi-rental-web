import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicRentalShell } from '../components/layout/PublicRentalShell';
import { ROUTES } from '../lib/constants/routes';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PublicRentalContactPage } from '../pages/rentals/PublicRentalContactPage';
import { PublicRentalDetailPage } from '../pages/rentals/PublicRentalDetailPage';
import { PublicRentalReservationPage } from '../pages/rentals/PublicRentalReservationPage';
import { PublicRentalsPage } from '../pages/rentals/PublicRentalsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRentalShell />}>
          <Route index element={<Navigate to={ROUTES.RENTALS} replace />} />
          <Route path={ROUTES.RENTALS} element={<PublicRentalsPage />} />
          <Route path={ROUTES.RENTAL_DETAILS} element={<PublicRentalDetailPage />} />
          <Route path={ROUTES.RENTAL_CONTACT} element={<PublicRentalContactPage />} />
          <Route path={ROUTES.RENTAL_RESERVATION} element={<PublicRentalReservationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
