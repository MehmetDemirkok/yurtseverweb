export const transferToSales = async (accommodationIds: number[]) => {
  try {
    const res = await fetch('/api/accommodation-sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accommodationIds })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Satışa aktarma başarısız');
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('Transfer to sales error:', error);
    throw error;
  }
};
