'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Check, Trash2, ChevronDown, ChevronRight
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import PageLoader from '@/components/ui/PageLoader';

interface ShoppingListItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  aisle: string | null;
  checked: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  items: ShoppingListItem[];
}

export default function ShoppingListsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping-lists');
      const data = await res.json();
      setLists(data);
      if (data.length > 0 && !expandedList) {
        setExpandedList(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch shopping lists:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session) fetchLists();
  }, [session, fetchLists]);

  const toggleItem = async (
    listId: string,
    itemId: string,
    checked: boolean
  ) => {
    // Optimistic update
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, checked } : item
              ),
            }
          : list
      )
    );

    await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked }),
    });
  };

  const deleteItem = async (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.filter((item) => item.id !== itemId),
            }
          : list
      )
    );

    await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
  };

  // Group items by aisle
  const groupByAisle = (items: ShoppingListItem[]) => {
    const groups: Record<string, ShoppingListItem[]> = {};
    for (const item of items) {
      const aisle = item.aisle || 'Other';
      if (!groups[aisle]) groups[aisle] = [];
      groups[aisle].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
        <ShoppingCart className="w-6 h-6 text-emerald-600" />
        Shopping Lists
      </h1>

      {lists.length === 0 ? (
        <EmptyState
          bordered
          icon={ShoppingCart}
          title="No shopping lists yet"
          description="Generate one from your meal plan"
        />
      ) : (
        <div className="space-y-4">
          {lists.map((list) => {
            const isExpanded = expandedList === list.id;
            const checkedCount = list.items.filter((i) => i.checked).length;
            const totalCount = list.items.length;

            return (
              <div
                key={list.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:bg-gray-900 dark:border-gray-800"
              >
                {/* List Header */}
                <button
                  onClick={() =>
                    setExpandedList(isExpanded ? null : list.id)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800"
                >
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{list.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {checkedCount}/{totalCount} items checked
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Progress Bar */}
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${
                            totalCount > 0
                              ? (checkedCount / totalCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-4 dark:border-gray-800">
                    {groupByAisle(list.items).map(([aisle, items]) => (
                      <div key={aisle}>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">
                          {aisle}
                        </h4>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 py-1.5 group"
                            >
                              <button
                                onClick={() =>
                                  toggleItem(
                                    list.id,
                                    item.id,
                                    !item.checked
                                  )
                                }
                                aria-label={`Mark ${item.name} as ${item.checked ? 'unchecked' : 'checked'}`}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  item.checked
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-gray-300 hover:border-emerald-500 dark:border-gray-600'
                                }`}
                              >
                                {item.checked && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>

                              <span
                                className={`flex-1 text-sm ${
                                  item.checked
                                    ? 'line-through text-gray-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {item.amount
                                  ? `${Math.round(item.amount * 10) / 10}`
                                  : ''}
                                {item.unit ? ` ${item.unit}` : ''}{' '}
                                {item.name}
                              </span>

                              <button
                                onClick={() =>
                                  deleteItem(list.id, item.id)
                                }
                                aria-label={`Delete ${item.name}`}
                                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
