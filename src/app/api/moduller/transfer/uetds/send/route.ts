import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAccess } from '@/lib/auth';
import { sendTransferToUetds } from '@/lib/uetds';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    const body = await request.json();
    const { transferId } = body || {};

    if (!transferId) {
      return NextResponse.json({ success: false, error: 'transferId zorunlu' }, { status: 400 });
    }

    const result = await sendTransferToUetds(transferId, user.companyId);
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'U-ETDS bildirimi başarısız' }, { status: 500 });
  }
}


