import { useEffect, useState } from 'react';

/** 极简 hash 路由：#/users/abc → { path: ['users', 'abc'] }。挂在 /admin/ 下，用 hash 不需要服务端配合。 */
export interface Route { path: string[]; query: URLSearchParams }

export const readRoute = (): Route => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [p = '', q = ''] = raw.split('?');
  return { path: p.split('/').filter(Boolean), query: new URLSearchParams(q) };
};

export const go = (path: string): void => {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
};

export const useRoute = (): Route => {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
};
