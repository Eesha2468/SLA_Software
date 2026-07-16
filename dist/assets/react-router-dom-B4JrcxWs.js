import{r as t,c as T,R as w}from"./react-framework-VA9qcqtj.js";import{l as p,R as F}from"./react-router-Fcrh1zn_.js";/**
 * React Router DOM v6.30.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const U="6";try{window.__reactRouterVersion=U}catch{}const E="startTransition",u=w[E];function y(e){let{basename:f,children:m,future:s,window:h}=e,n=t.useRef();n.current==null&&(n.current=T({window:h,v5Compat:!0}));let r=n.current,[o,i]=t.useState({action:r.action,location:r.location}),{v7_startTransition:a}=s||{},c=t.useCallback(l=>{a&&u?u(()=>i(l)):i(l)},[i,a]);return t.useLayoutEffect(()=>r.listen(c),[r,c]),t.useEffect(()=>p(s),[s]),t.createElement(F,{basename:f,children:m,location:o.location,navigationType:o.action,navigator:r,future:s})}var R;(function(e){e.UseScrollRestoration="useScrollRestoration",e.UseSubmit="useSubmit",e.UseSubmitFetcher="useSubmitFetcher",e.UseFetcher="useFetcher",e.useViewTransitionState="useViewTransitionState"})(R||(R={}));var S;(function(e){e.UseFetcher="useFetcher",e.UseFetchers="useFetchers",e.UseScrollRestoration="useScrollRestoration"})(S||(S={}));export{y as B};
