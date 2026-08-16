import { useMemo, useState } from 'react';
import {
  Calculator,
  Wallet,
  TrendingUp,
  TrendingDown,
  Server,
  Users,
  DollarSign,
  Gauge,
  Settings2,
  Percent,
} from 'lucide-react';
import { useStore } from '@/store';
import { formatCost } from '@/lib/format';
import { Card, Field, PageHeader, StatCard, TextInput } from '@/components/ui';

export function FinancialsPage() {
  const { vpsList, clients, priceConfig, setPriceConfig, pushToast } = useStore();
  const [estimatorGb, setEstimatorGb] = useState('150');

  const revenue = useMemo(() => clients.reduce((s, c) => s + c.sellingPrice, 0), [clients]);
  const vpsExpenses = useMemo(() => vpsList.reduce((s, v) => s + v.monthlyCost, 0), [vpsList]);
  const netProfit = revenue - vpsExpenses;
  const marginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const estimatorValue = Number(estimatorGb) || 0;
  const predictedPrice = estimatorValue * priceConfig.baseRatePerGb;
  const perClientCost = vpsList.length > 0 ? vpsExpenses / Math.max(1, clients.length) : 0;
  const estProfitMargin = predictedPrice > 0 ? ((predictedPrice - perClientCost) / predictedPrice) * 100 : 0;

  const updateRate = (val: string) => {
    const num = Number(val) || 0;
    setPriceConfig((prev) => ({ ...prev, baseRatePerGb: num }));
    if (num > 0) pushToast('success', 'Rate updated', `Base rate set to ${priceConfig.currency} ${num}/GB.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Financials & Price Calculator"
        subtitle="Revenue, expenses and pricing rules"
        icon={<Calculator className="h-6 w-6" />}
      />

      {/* Profit breakdown */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Revenue"
          value={formatCost(revenue)}
          tone="emerald"
          sub={`${clients.length} active subscriptions`}
        />
        <StatCard
          icon={<Server className="h-4 w-4" />}
          label="VPS Hosting Expenses"
          value={formatCost(vpsExpenses)}
          tone="rose"
          sub={`${vpsList.length} nodes monthly`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Net Profit"
          value={formatCost(netProfit)}
          tone="cyan"
          sub={`${marginPct.toFixed(1)}% margin`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Price Rule Configurator */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3.5">
            <Settings2 className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-200">Price Rule Configurator</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Currency">
                <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-100">{priceConfig.currency}</span>
                </div>
              </Field>
              <Field label="Base Rate per GB" hint="Rs / GB">
                <TextInput
                  value={String(priceConfig.baseRatePerGb)}
                  onChange={(e) => updateRate(e.target.value)}
                  inputMode="numeric"
                  placeholder="20"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs text-slate-500">Current pricing model</p>
              <p className="mt-1 text-sm text-slate-200">
                <span className="font-semibold text-sky-400">{priceConfig.currency} {priceConfig.baseRatePerGb}</span>
                <span className="text-slate-400"> per GB of data allowance</span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Used as the live calculator hint when onboarding clients. Unlimited plans use the preset's flat suggested price.
              </p>
            </div>

            {/* Cost breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Users className="h-3.5 w-3.5" /> Avg cost per client
                </span>
                <span className="font-medium text-slate-200">{formatCost(Math.round(perClientCost))}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Server className="h-3.5 w-3.5" /> Most expensive node
                </span>
                <span className="font-medium text-slate-200">
                  {formatCost(Math.max(0, ...vpsList.map((v) => v.monthlyCost)))}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <TrendingDown className="h-3.5 w-3.5" /> Cheapest node
                </span>
                <span className="font-medium text-slate-200">
                  {formatCost(vpsList.length > 0 ? Math.min(...vpsList.map((v) => v.monthlyCost)) : 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing Estimator Widget */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3.5">
            <Gauge className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Pricing Estimator</h2>
          </div>
          <div className="space-y-5 p-5">
            <Field label="Data Allowance (GB)" hint="type any amount">
              <div className="relative">
                <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <TextInput
                  value={estimatorGb}
                  onChange={(e) => setEstimatorGb(e.target.value)}
                  inputMode="numeric"
                  placeholder="150"
                  className="pl-9 text-lg font-semibold"
                />
              </div>
            </Field>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {[50, 100, 200, 500].map((gb) => (
                <button
                  key={gb}
                  onClick={() => setEstimatorGb(String(gb))}
                  className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-sky-500/40 hover:text-sky-300"
                >
                  {gb} GB
                </button>
              ))}
              <button
                onClick={() => setEstimatorGb('0')}
                className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-sky-500/40 hover:text-sky-300"
              >
                Unlimited
              </button>
            </div>

            {/* Result */}
            <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-cyan-500/5 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Predicted Selling Price</p>
              <p className="mt-1 text-3xl font-bold text-sky-300">
                {priceConfig.currency} {predictedPrice.toLocaleString('en-PK')}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <p className="inline-flex items-center gap-1 text-[10px] uppercase text-slate-500">
                    <Percent className="h-3 w-3" /> Est. Profit Margin
                  </p>
                  <p className={`mt-0.5 text-lg font-semibold ${estProfitMargin > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {estProfitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <p className="inline-flex items-center gap-1 text-[10px] uppercase text-slate-500">
                    <DollarSign className="h-3 w-3" /> Est. Profit
                  </p>
                  <p className={`mt-0.5 text-lg font-semibold ${predictedPrice - perClientCost > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCost(Math.round(predictedPrice - perClientCost))}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Based on {priceConfig.currency} {priceConfig.baseRatePerGb}/GB rate minus average per-client hosting cost of {formatCost(Math.round(perClientCost))}.
            </p>
          </div>
        </Card>
      </div>

      {/* VPS cost breakdown table */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3.5">
          <Server className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">VPS Hosting Cost Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Node</th>
                <th className="px-4 py-3 font-medium">Clients</th>
                <th className="px-4 py-3 font-medium">Monthly Cost</th>
                <th className="px-4 py-3 font-medium">Cost / Client</th>
                <th className="px-4 py-3 font-medium">Revenue from Node</th>
                <th className="px-4 py-3 font-medium">Node Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {vpsList.map((v) => {
                const nodeClients = clients.filter((c) => c.vpsId === v.id);
                const nodeRevenue = nodeClients.reduce((s, c) => s + c.sellingPrice, 0);
                const nodeProfit = nodeRevenue - v.monthlyCost;
                const costPerClient = nodeClients.length > 0 ? v.monthlyCost / nodeClients.length : 0;
                return (
                  <tr key={v.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-100">{v.name}</td>
                    <td className="px-4 py-3 text-slate-300">{nodeClients.length}</td>
                    <td className="px-4 py-3 text-rose-300">{formatCost(v.monthlyCost)}</td>
                    <td className="px-4 py-3 text-slate-300">{formatCost(Math.round(costPerClient))}</td>
                    <td className="px-4 py-3 text-emerald-300">{formatCost(nodeRevenue)}</td>
                    <td className={`px-4 py-3 font-medium ${nodeProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {formatCost(nodeProfit)}
                    </td>
                  </tr>
                );
              })}
              {vpsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No VPS nodes configured.
                  </td>
                </tr>
              )}
            </tbody>
            {vpsList.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-800 text-xs font-semibold text-slate-300">
                  <td className="px-4 py-3" colSpan={2}>Totals</td>
                  <td className="px-4 py-3 text-rose-300">{formatCost(vpsExpenses)}</td>
                  <td className="px-4 py-3">{formatCost(Math.round(perClientCost))}</td>
                  <td className="px-4 py-3 text-emerald-300">{formatCost(revenue)}</td>
                  <td className={`px-4 py-3 ${netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatCost(netProfit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
