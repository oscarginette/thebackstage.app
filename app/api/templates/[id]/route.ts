import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { UpdateEmailTemplateSchema } from '@/lib/validation-schemas';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const useCase = UseCaseFactory.createGetEmailTemplatesUseCase();
    const template = await useCase.getById(id);
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ template: template.toJSON() });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();

    // Validate request body
    const validation = UpdateEmailTemplateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const useCase = UseCaseFactory.createUpdateEmailTemplateUseCase();
    const result = await useCase.execute({ id: id, ...validation.data });
    return NextResponse.json({ template: result.template.toJSON(), isNewVersion: result.isNewVersion });
  } catch (error: unknown) {
    const status = (error instanceof Error && error.name === 'ValidationError') ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const useCase = UseCaseFactory.createDeleteEmailTemplateUseCase();
    const result = await useCase.execute({ id: id });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const status = (error instanceof Error && error.name === 'ValidationError') ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status });
  }
}
