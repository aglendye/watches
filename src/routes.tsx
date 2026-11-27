import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { OfflineBanner } from './components/Banners';
import { TabBar } from './components/TabBar';
import { Button } from './components/ui';
import { DialFace } from './components/Dial';
import { useAuth } from './lib/auth';
import { AddWatch } from './screens/AddWatch';
import { BrandPage, Brands, ModelPage } from './screens/Browse';
import { Collection } from './screens/Collection';
import { Auth } from './screens/Auth';
import { Diary } from './screens/Diary';
import { EditWatch } from './screens/EditWatch';
import { Home } from './screens/Home';
import { ListDetailScreen, Lists } from './screens/Lists';
import { Me } from './screens/Me';
import { People, PersonPage } from './screens/People';
import { Search, SearchLayout } from './screens/Search';
import { Watch } from './screens/Watch';

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <div className="w-20 opacity-70">
        <DialFace hand={null} centerText="" showNumbers={false} />
      </div>
    </div>
  );
}

function CantConnect() {
  const { refresh } = useAuth();
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="text-lg font-semibold">Can’t reach the server.</p>
        <p className="mt-1 text-muted">Check your connection and try again.</p>
        <Button className="mt-4" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    </div>
  );
}

/** Scroll to top on navigation (hash routes don't do it by themselves). */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SignedInLayout() {
  const { status } = useAuth();
  if (status === 'signedOut') return <Navigate to="/auth" replace />;
  return (
    <>
      <OfflineBanner />
      <main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
        <Outlet />
      </main>
      <TabBar />
    </>
  );
}

function SignedOutLayout() {
  const { status } = useAuth();
  if (status === 'signedIn') return <Navigate to="/" replace />;
  return (
    <>
      <OfflineBanner />
      <main className="mx-auto max-w-md px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </>
  );
}

export function AppRoutes() {
  const { status } = useAuth();
  if (status === 'loading') return <Splash />;
  if (status === 'offline') return <CantConnect />;
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route element={<SignedOutLayout />}>
          <Route path="/auth" element={<Auth />} />
        </Route>
        <Route element={<SignedInLayout />}>
          <Route element={<SearchLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
          </Route>
          <Route path="/add" element={<AddWatch />} />
          <Route path="/browse" element={<Brands />} />
          <Route path="/browse/:brandId" element={<BrandPage />} />
          <Route path="/browse/:brandId/:modelId" element={<ModelPage />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/watch/:id/edit" element={<EditWatch />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/me" element={<Me />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:id" element={<PersonPage />} />
          <Route path="/lists/:id" element={<ListDetailScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
