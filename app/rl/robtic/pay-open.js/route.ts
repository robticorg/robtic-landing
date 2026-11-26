import { asset } from '@/lib/asset';

// The pay popup's starter, for every Robtic place: a few lines, never cached, that give the page
// window.RobticPay.open() at once (calls wait in a queue) and load the current build of the popup (its URL carries a
// hash of its contents, so it can be cached for long).
export function GET() {
    const src = asset('/rl/robtic/pay/pay.js');
    const js = `(function(){if(window.RobticPay)return;var q=window.__robticPayQueue=window.__robticPayQueue||[];window.RobticPay={stub:true,open:function(o){return new Promise(function(r){q.push([o,r]);});}};var s=document.createElement('script');s.src=${JSON.stringify(src)};s.async=true;document.head.appendChild(s);})();`;
    return new Response(js, { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
