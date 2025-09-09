'use client';

import { useState, useEffect } from 'react';

interface EventSourcingStats {
  commandHandlers: number;
  queryHandlers: number;
  totalEvents?: number;
}

interface Event {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: string;
  data: Record<string, any>;
  metadata: any;
}

export default function EventSourcingStatus(): void {
  const [stats, setStats] = useState<EventSourcingStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testCommand, setTestCommand] = useState({
    type: 'CreateUser',
    aggregateId: `user_${Date.now()}`,
    data: {
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org_123'
    }
  });

  useEffect(() => {
    fetchEventSourcingData();
    const interval = setInterval(fetchEventSourcingData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchEventSourcingData = async () => {
    try {
      setLoading(true);

      // Obtener estadísticas
      const statsResponse = await fetch('/api/events/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Obtener eventos (desde el API principal)
      const eventsResponse = await fetch('http://localhost:4000/v1/events/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.data.events || []);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch event sourcing data');
      console.error('Error fetching event sourcing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeTestCommand = async () => {
    try {
      const response = await fetch('/api/events/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user',
          'x-organization-id': 'org_123',
        },
        body: JSON.stringify(testCommand),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Command executed successfully!\nCommand ID: ${result.data.commandId}`);
        fetchEventSourcingData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Command failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error executing command:', err);
      alert('Error executing command');
    }
  };

  const executeTestQuery = async () => {
    try {
      const response = await fetch('/api/events/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user',
          'x-organization-id': 'org_123',
        },
        body: JSON.stringify({
          type: 'GetUsersByOrganization',
          data: { organizationId: 'org_123' }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Query executed successfully!\nResult: ${JSON.stringify(result.data, null, 2)}`);
      } else {
        const error = await response.json();
        alert(`Query failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error executing query:', err);
      alert('Error executing query');
    }
  };

  const replayEvents = async () => {
    try {
      const response = await fetch('http://localhost:4000/v1/events/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }), // Last 24 hours
      });

      if (response.ok) {
        alert('Event replay completed successfully!');
        fetchEventSourcingData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Event replay failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Error replaying events:', err);
      alert('Error replaying events');
    }
  };

  if (loading) {
    return (;
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Event Sourcing & CQRS</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (;
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Event Sourcing & CQRS</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">System Statistics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.commandHandlers}</div>
              <div className="text-sm text-gray-500">Command Handlers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.queryHandlers}</div>
              <div className="text-sm text-gray-500">Query Handlers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalEvents || 0}</div>
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Test Commands & Queries</h4>
        <div className="space-y-3">
          <div className="border rounded p-3">
            <h5 className="font-medium mb-2">Test Command</h5>
            <div className="text-xs text-gray-600 mb-2">
              Type: {testCommand.type} | Aggregate: {testCommand.aggregateId}
            </div>
            <button
              onClick={executeTestCommand}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
            >
              Execute Command
            </button>
          </div>

          <div className="border rounded p-3">
            <h5 className="font-medium mb-2">Test Query</h5>
            <div className="text-xs text-gray-600 mb-2">
              Type: GetUsersByOrganization | Organization: org_123
            </div>
            <button
              onClick={executeTestQuery}
              className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
            >
              Execute Query
            </button>
          </div>

          <div className="border rounded p-3">
            <h5 className="font-medium mb-2">Event Replay</h5>
            <div className="text-xs text-gray-600 mb-2">
              Replay events from last 24 hours
            </div>
            <button
              onClick={replayEvents}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1 rounded"
            >
              Replay Events
            </button>
          </div>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Recent Events ({events.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {events.slice(-10).map((event) => (
              <div key={event.id} className="border rounded p-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{event.type}</span>
                    <span className="text-gray-500 ml-2">v{event.version}</span>
                  </div>
                  <span className="text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-600 mt-1">
                  Aggregate: {event.aggregateId} ({event.aggregateType})
                </div>
                <div className="text-gray-500 mt-1 truncate">
                  {JSON.stringify(event.data)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>📊 Event Sourcing with aggregates and event store</p>
        <p>🔄 CQRS with separate command and query handlers</p>
        <p>📈 Event replay and projection rebuilding</p>
        <p>🔒 Concurrency control with optimistic locking</p>
      </div>
    </div>
  );
}
