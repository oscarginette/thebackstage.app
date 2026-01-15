'use client';

interface CampaignMetadataProps {
  metadata: {
    trackTitle?: string;
    trackUrl?: string;
    greeting?: string;
    message?: string;
    signature?: string;
    coverImageUrl?: string;
  };
  visibleFields?: Array<'track' | 'greeting' | 'message' | 'signature' | 'coverImage'>;
  className?: string;
}

/**
 * CampaignMetadata
 *
 * Displays campaign metadata in a responsive grid layout.
 * Shows only specified fields via visibleFields prop.
 *
 * Used in: CampaignPreviewModal, potentially in campaign history lists.
 *
 * @example
 * <CampaignMetadata
 *   metadata={campaign.metadata}
 *   visibleFields={['track', 'greeting', 'signature']}
 * />
 */
export default function CampaignMetadata({
  metadata,
  visibleFields = ['track', 'greeting', 'signature'],
  className = '',
}: CampaignMetadataProps) {
  // Field configuration
  const fieldConfig = {
    track: {
      label: 'Track',
      getValue: () => metadata.trackTitle,
      render: () =>
        metadata.trackUrl ? (
          <a
            href={metadata.trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-serif text-foreground truncate hover:text-accent transition-colors"
          >
            {metadata.trackTitle}
          </a>
        ) : (
          <div className="text-sm font-serif text-foreground truncate">
            {metadata.trackTitle}
          </div>
        ),
    },
    greeting: {
      label: 'Greeting',
      getValue: () => metadata.greeting,
      render: () => (
        <div
          className="text-sm text-muted-foreground truncate"
          dangerouslySetInnerHTML={{ __html: metadata.greeting || '' }}
        />
      ),
    },
    message: {
      label: 'Message',
      getValue: () => metadata.message,
      render: () => (
        <div
          className="text-sm text-muted-foreground truncate"
          dangerouslySetInnerHTML={{ __html: metadata.message || '' }}
        />
      ),
    },
    signature: {
      label: 'Signature',
      getValue: () => metadata.signature,
      render: () => (
        <div
          className="text-sm text-muted-foreground truncate"
          dangerouslySetInnerHTML={{ __html: metadata.signature || '' }}
        />
      ),
    },
    coverImage: {
      label: 'Cover Image',
      getValue: () => metadata.coverImageUrl,
      render: () =>
        metadata.coverImageUrl ? (
          <img
            src={metadata.coverImageUrl}
            alt="Cover"
            className="h-8 w-8 object-cover rounded"
          />
        ) : null,
    },
  };

  // Filter visible fields that have values
  const fieldsToRender = visibleFields.filter((field) => {
    const config = fieldConfig[field];
    return config && config.getValue();
  });

  // Don't render if no fields to show
  if (fieldsToRender.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fieldsToRender.map((field) => {
          const config = fieldConfig[field];
          return (
            <div key={field}>
              <div className="text-[9px] text-foreground font-black uppercase tracking-wider mb-0.5">
                {config.label}
              </div>
              {config.render()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
