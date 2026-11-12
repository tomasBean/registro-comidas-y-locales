import { useState } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { createGeocoder, createRepository } from './data';
import { DataProvider } from './features/app/DataProvider';
import { routes } from './features/app/routes';
import { HomeScreen } from './features/home/HomeScreen';
import { ItemScreen } from './features/item/ItemScreen';
import { MapScreen } from './features/map/MapScreen';
import { PlaceFormScreen } from './features/place-form/PlaceFormScreen';
import { PlaceScreen } from './features/place/PlaceScreen';
import { PlacesScreen } from './features/places/PlacesScreen';
import { StatsScreen } from './features/stats/StatsScreen';
import { VisitFormScreen } from './features/visit-form/VisitFormScreen';
import { BottomNav } from './ui/layout/BottomNav';
import type { BottomNavItem } from './ui/layout/BottomNav';

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

function MainNav() {
  const { pathname } = useLocation();
  const entry = (
    key: string,
    label: string,
    to: string,
    iconPath: string,
    active: boolean,
    primary = false,
  ): BottomNavItem => ({
    key,
    label,
    icon: icon(iconPath),
    active,
    primary,
    render: ({ className, children }) => (
      <NavLink to={to} className={className} aria-current={active ? 'page' : undefined}>
        {children}
      </NavLink>
    ),
  });

  return (
    <BottomNav
      items={[
        entry('home', 'Inicio', routes.home(), 'M4 11l8-7 8 7v9h-5v-6H9v6H4z', pathname === '/'),
        entry(
          'places',
          'Lugares',
          routes.places(),
          'M5 6h14M5 12h14M5 18h14',
          pathname.startsWith('/places') || pathname.startsWith('/items'),
        ),
        entry('new', 'Registrar', routes.newVisit(), 'M12 5v14M5 12h14', pathname.startsWith('/visits/new'), true),
        entry(
          'map',
          'Mapa',
          routes.map(),
          'M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
          pathname.startsWith('/map'),
        ),
        entry('stats', 'Resumen', routes.stats(), 'M5 20V10M12 20V4M19 20v-7', pathname.startsWith('/stats')),
      ]}
    />
  );
}

// HashRouter: GitHub Pages cannot rewrite unknown paths to index.html.
export function App() {
  const [repository] = useState(createRepository);
  const [geocoder] = useState(createGeocoder);
  return (
    <DataProvider repository={repository} geocoder={geocoder}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/places" element={<PlacesScreen />} />
          <Route path="/places/new" element={<PlaceFormScreen />} />
          <Route path="/places/:placeId" element={<PlaceScreen />} />
          <Route path="/places/:placeId/edit" element={<PlaceFormScreen />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/stats" element={<StatsScreen />} />
          <Route path="/items/:itemId" element={<ItemScreen />} />
          <Route path="/visits/new" element={<VisitFormScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <MainNav />
      </HashRouter>
    </DataProvider>
  );
}
