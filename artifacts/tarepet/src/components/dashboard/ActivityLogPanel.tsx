import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, 
  Database, RefreshCw, Send, Download, Search, Filter, Terminal, 
  ExternalLink, User, Globe, Server, Check, Clock
} from 'lucide-react';
import { authClient } from '@/lib/api-auth';
import { useTranslation } from '@/i18n/useTranslation';

interface ActivityLogItem {
  id: number;
  type: string;
  activity_type: string;
  title: string;
  detail: string;
  user: string;
  ip_address?: string;
  user_agent?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'AUTH' | 'ACADEMICS' | 'FINANCE' | 'CBT' | 'SECURITY' | 'SYSTEM';
  timestamp: string;
}

interface SystemHealthData {
  status: 'OPERATIONAL' | 'DEGRADED';
  database: {
    connected: boolean;
    latency_ms: number;
    engine: string;
  };
  telemetry: {
    errors_24h: number;
    total_activity_logs: number;
    total_cookie_consents: number;
  };
  email_service: {
    configured: boolean;
    backend: string;
    alert_recipient: string;
  };
}

export function ActivityLogPanel() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [testAlertMessage, setTestAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchLogsAndHealth = async () => {
    setIsRefreshing(true);
    try {
      const [logsRes, healthRes] = await Promise.all([
        authClient.get('/communication/activities/').catch(() => ({ data: [] })),
        authClient.get('/communication/system-health/').catch(() => ({ data: null })),
      ]);

      const logData = Array.isArray(logsRes.data) 
        ? logsRes.data 
        : (logsRes.data?.results || []);
      setLogs(logData);
      setHealth(healthRes.data);
    } catch (e) {
      console.warn('Failed to load activity logs:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogsAndHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogsAndHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTestAlert = async () => {
    setTestAlertSending(true);
    setTestAlertMessage(null);
    try {
      await authClient.post('/communication/system-health/test-alert/', {});
      setTestAlertMessage({
        type: 'success',
        text: 'Live test alert email dispatched successfully! Check the administrative inbox.',
      });
      fetchLogsAndHealth();
    } catch (err: any) {
      setTestAlertMessage({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to dispatch test alert email. Verify SMTP settings in backend.',
      });
    } finally {
      setTestAlertSending(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSeverity = selectedSeverity === 'ALL' || (log.severity || 'INFO').toUpperCase() === selectedSeverity;
      const matchesCategory = selectedCategory === 'ALL' || (log.category || 'SYSTEM').toUpperCase() === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        (log.title || '').toLowerCase().includes(q) ||
        (log.detail || '').toLowerCase().includes(q) ||
        (log.user || '').toLowerCase().includes(q) ||
        (log.ip_address || '').toLowerCase().includes(q) ||
        (log.activity_type || '').toLowerCase().includes(q);

      return matchesSeverity && matchesCategory && matchesSearch;
    });
  }, [logs, selectedSeverity, selectedCategory, searchQuery]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tarepet_activity_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-6 h-6 text-primary" />
            <h2 className="font-serif font-bold text-2xl text-foreground">
              {t('System Activity & Telemetry Guardian', 'System Activity & Telemetry Guardian')}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {t('Live Feed', 'Live Feed')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('Audit trail of portal actions, cookie consents, security alerts, and live error telemetry.', 'Audit trail of portal actions, cookie consents, security alerts, and live error telemetry.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogsAndHealth}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            {t('Refresh', 'Refresh')}
          </button>
          <button
            onClick={handleExportJSON}
            disabled={logs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            {t('Export Audit', 'Export Audit')}
          </button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Database Status */}
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Database Status', 'Database Status')}</p>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.database?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-serif font-bold text-lg text-foreground">
                {health?.database?.connected ? t('Operational', 'Operational') : t('Checking…', 'Checking…')}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              {health?.database?.latency_ms !== undefined ? `${health.database.latency_ms}ms latency` : 'Layerbase Postgres'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* 24h Alerts */}
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Errors (Past 24h)', 'Errors (Past 24h)')}</p>
            <span className="font-serif font-bold text-2xl text-foreground">
              {health?.telemetry?.errors_24h ?? 0}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">
              {health?.telemetry?.errors_24h === 0 ? t('All clear • Zero defects', 'All clear • Zero defects') : t('Logged in telemetry', 'Logged in telemetry')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Total Cookie Consents */}
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Cookie Consents', 'Cookie Consents')}</p>
            <span className="font-serif font-bold text-2xl text-foreground">
              {health?.telemetry?.total_cookie_consents ?? 0}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">{t('Stored in Backend DB', 'Stored in Backend DB')}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Live Email Alert Gateway */}
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Live Email Feedback', 'Live Email Feedback')}</p>
            <p className="text-xs font-semibold text-foreground truncate" title={health?.email_service?.alert_recipient}>
              {health?.email_service?.alert_recipient || 'admin@tarepet.com'}
            </p>
          </div>
          <button
            onClick={handleSendTestAlert}
            disabled={testAlertSending}
            className="mt-2.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-bold transition flex items-center justify-center gap-1.5"
          >
            <Send className={`w-3 h-3 ${testAlertSending ? 'animate-pulse' : ''}`} />
            {testAlertSending ? t('Sending…', 'Sending…') : t('Send Test Alert Email', 'Send Test Alert Email')}
          </button>
        </div>

      </div>

      {testAlertMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
          testAlertMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`}>
          <span>{testAlertMessage.text}</span>
          <button onClick={() => setTestAlertMessage(null)} className="font-bold ml-3 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('Search by user, title, IP address, or activity keyword...', 'Search by user, title, IP address, or activity keyword...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">Severity: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">Category: All</option>
              <option value="AUTH">Authentication</option>
              <option value="FINANCE">Finance & Bursary</option>
              <option value="CBT">CBT Examinations</option>
              <option value="SECURITY">Security</option>
              <option value="SYSTEM">System & Cookies</option>
            </select>
          </div>

        </div>
      </div>

      {/* Activity Logs Stream */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-16 rounded-2xl border-2 border-dashed border-border text-center space-y-2">
            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-bold text-muted-foreground">{t('No activity records match your criteria', 'No activity records match your criteria')}</p>
            <p className="text-xs text-muted-foreground">{t('Activities and telemetry signals will stream here automatically.', 'Activities and telemetry signals will stream here automatically.')}</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const sev = (log.severity || 'INFO').toUpperCase();

            const severityBadge = 
              sev === 'CRITICAL' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
              sev === 'ERROR' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
              sev === 'WARNING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
              'bg-blue-500/10 text-blue-600 border-blue-500/20';

            return (
              <div 
                key={log.id} 
                className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-card transition-all shadow-sm space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityBadge}`}>
                      {sev}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {log.category || 'SYSTEM'}
                    </span>
                    <h4 className="font-bold text-sm text-foreground">{log.title}</h4>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span className="font-semibold text-foreground">{log.user || 'System / Guest'}</span>
                  </div>
                  {log.ip_address && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Globe className="w-3 h-3 text-muted-foreground/70" />
                      <span>{log.ip_address}</span>
                    </div>
                  )}
                  {log.activity_type && (
                    <span className="text-[10px] font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/50 text-foreground">
                      {log.activity_type}
                    </span>
                  )}
                </div>

                {log.detail && (
                  <div className="pt-1">
                    {isExpanded ? (
                      <div className="space-y-2">
                        <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64 border border-slate-800">
                          {log.detail}
                        </pre>
                        {log.user_agent && (
                          <p className="text-[11px] text-muted-foreground break-all">
                            <strong>Agent:</strong> {log.user_agent}
                          </p>
                        )}
                        <button
                          onClick={() => setExpandedLogId(null)}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          {t('Collapse details', 'Collapse details')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-muted-foreground line-clamp-1 flex-1 pr-4">{log.detail}</p>
                        <button
                          onClick={() => setExpandedLogId(log.id)}
                          className="text-[11px] font-bold text-primary hover:underline shrink-0"
                        >
                          {t('View payload', 'View payload')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
