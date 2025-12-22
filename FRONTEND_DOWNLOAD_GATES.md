# Frontend Architecture - Download Gates

## Overview

El frontend se divide en **dos áreas principales**:

1. **DJ Dashboard** (Autenticado) - Donde los DJs crean y gestionan sus download gates
2. **Public Landing Page** (Público) - Donde los fans descargan los tracks

---

## 1. DJ Dashboard (Authenticated)

### Rutas

```
/dashboard/download-gates           → Lista de gates del DJ
/dashboard/download-gates/new       → Crear nuevo gate
/dashboard/download-gates/[id]      → Ver/editar gate + analytics
```

---

### 1.1 Lista de Gates (`/dashboard/download-gates`)

**Componente**: `app/dashboard/download-gates/page.tsx`

**Funcionalidad**:
- Tabla con todos los gates del DJ actual
- Columnas: Title, Slug, Views, Submissions, Downloads, Conversion %, Actions
- Botón "Create New Gate" (top-right)
- Acciones por fila: Ver stats, Editar, Copiar link público, Eliminar

**API Calls**:
```typescript
// GET /api/download-gates
const gates = await fetch('/api/download-gates', {
  headers: { 'Authorization': `Bearer ${session.token}` }
});
```

**Estado Local**:
```typescript
const [gates, setGates] = useState<DownloadGate[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**UI Components**:
```tsx
<DashboardLayout>
  <div className="header">
    <h1>Download Gates</h1>
    <Button href="/dashboard/download-gates/new">
      Create New Gate
    </Button>
  </div>

  <DataTable
    columns={[
      { key: 'title', label: 'Track Title' },
      { key: 'slug', label: 'Slug' },
      { key: 'views', label: 'Views' },
      { key: 'submissions', label: 'Submissions' },
      { key: 'downloads', label: 'Downloads' },
      { key: 'conversion', label: 'Conversion %' },
      { key: 'actions', label: 'Actions' }
    ]}
    data={gates}
    onRowClick={(gate) => router.push(`/dashboard/download-gates/${gate.id}`)}
  />
</DashboardLayout>
```

**Example Row**:
| Title | Slug | Views | Submissions | Downloads | Conversion | Actions |
|-------|------|-------|-------------|-----------|------------|---------|
| El House (Edit) | el-house-edit | 523 | 287 | 245 | 46.8% | [👁️ Stats] [✏️ Edit] [🔗 Copy] [🗑️] |

---

### 1.2 Crear Gate (`/dashboard/download-gates/new`)

**Componente**: `app/dashboard/download-gates/new/page.tsx`

**Formulario** (multi-step wizard):

**Step 1: Track Details**
```tsx
<FormSection title="Track Details">
  <Input
    label="Track Title"
    name="title"
    placeholder="El House (Edit x Alejandro Paz)"
    required
  />

  <Input
    label="Description (optional)"
    name="description"
    type="textarea"
    placeholder="Free download of my latest track..."
  />

  <Input
    label="SoundCloud Track URL"
    name="soundcloudTrackUrl"
    placeholder="https://soundcloud.com/geebeat/el-house"
    hint="We'll extract the track ID automatically"
    required
  />

  <ImageUpload
    label="Artwork"
    name="artworkUrl"
    hint="Or we'll fetch it from SoundCloud automatically"
  />
</FormSection>
```

**Step 2: File Configuration**
```tsx
<FormSection title="Download File">
  <Input
    label="File URL"
    name="fileUrl"
    placeholder="https://www.dropbox.com/s/xxx/track.wav?dl=1"
    hint="External link (Dropbox, Drive, WeTransfer, etc)"
    required
  />

  <Select
    label="File Type"
    name="fileType"
    options={[
      { value: 'audio/wav', label: 'WAV' },
      { value: 'audio/flac', label: 'FLAC' },
      { value: 'audio/mp3', label: 'MP3' },
      { value: 'application/zip', label: 'ZIP (Stems)' }
    ]}
  />
</FormSection>
```

**Step 3: Requirements**
```tsx
<FormSection title="Unlock Requirements">
  <CheckboxGroup label="What actions must fans complete?">
    <Checkbox
      name="requireEmail"
      label="Email Address"
      checked={true}
      disabled={true}
      hint="Always required (GDPR compliant)"
    />

    <Checkbox
      name="requireSoundcloudRepost"
      label="Repost on SoundCloud"
      defaultChecked={true}
    />

    <Checkbox
      name="requireSoundcloudFollow"
      label="Follow on SoundCloud"
      defaultChecked={false}
    />

    <Checkbox
      name="requireSpotifyConnect"
      label="Connect Spotify (optional)"
      defaultChecked={false}
      hint="This is optional for users, gives bonus but not required"
    />
  </CheckboxGroup>
</FormSection>
```

**Step 4: Settings (Optional)**
```tsx
<FormSection title="Advanced Settings">
  <Input
    label="Max Downloads"
    name="maxDownloads"
    type="number"
    placeholder="Unlimited"
    hint="Leave empty for unlimited"
  />

  <Input
    label="Expiry Date"
    name="expiresAt"
    type="datetime-local"
    hint="Gate will be disabled after this date"
  />

  <Input
    label="Custom Slug"
    name="slug"
    placeholder="el-house-edit"
    hint="Auto-generated from title if empty"
  />
</FormSection>
```

**Submit Button**:
```tsx
<div className="actions">
  <Button variant="secondary" href="/dashboard/download-gates">
    Cancel
  </Button>

  <Button
    type="submit"
    loading={submitting}
    disabled={!isValid}
  >
    Create Download Gate
  </Button>
</div>
```

**API Call**:
```typescript
const handleSubmit = async (data: CreateGateFormData) => {
  setSubmitting(true);

  try {
    const response = await fetch('/api/download-gates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        soundcloudTrackUrl: data.soundcloudTrackUrl,
        artworkUrl: data.artworkUrl,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        requireSoundcloudRepost: data.requireSoundcloudRepost,
        requireSoundcloudFollow: data.requireSoundcloudFollow,
        requireSpotifyConnect: data.requireSpotifyConnect,
        maxDownloads: data.maxDownloads,
        expiresAt: data.expiresAt,
        slug: data.slug
      })
    });

    if (!response.ok) throw new Error('Failed to create gate');

    const gate = await response.json();

    toast.success('Gate created successfully!');
    router.push(`/dashboard/download-gates/${gate.id}`);

  } catch (error) {
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};
```

---

### 1.3 Ver/Editar Gate + Analytics (`/dashboard/download-gates/[id]`)

**Componente**: `app/dashboard/download-gates/[id]/page.tsx`

**Layout** (3 tabs):

**Tab 1: Overview**
```tsx
<div className="grid grid-cols-3 gap-4">
  <StatCard
    title="Total Views"
    value={gate.stats.views}
    icon={<EyeIcon />}
  />

  <StatCard
    title="Submissions"
    value={gate.stats.submissions}
    icon={<UserIcon />}
  />

  <StatCard
    title="Downloads"
    value={gate.stats.downloads}
    icon={<DownloadIcon />}
    trend={+12.5}
  />

  <StatCard
    title="Conversion Rate"
    value={`${gate.stats.conversionRate}%`}
    icon={<ChartIcon />}
  />

  <StatCard
    title="SoundCloud Reposts"
    value={gate.stats.soundcloudReposts}
    icon={<SoundCloudIcon />}
  />

  <StatCard
    title="Spotify Connections"
    value={gate.stats.spotifyConnections}
    icon={<SpotifyIcon />}
  />
</div>

<div className="public-link">
  <h3>Public Link</h3>
  <CopyableLink
    url={`https://geebeat.com/gate/${gate.slug}`}
    qrCode={true}
  />

  <ShareButtons
    url={`https://geebeat.com/gate/${gate.slug}`}
    title={gate.title}
    platforms={['instagram', 'twitter', 'facebook', 'whatsapp']}
  />
</div>

<ConversionFunnel
  data={[
    { step: 'Views', count: gate.stats.views, percentage: 100 },
    { step: 'Email Submitted', count: gate.stats.submissions, percentage: 54.8 },
    { step: 'SoundCloud Repost', count: gate.stats.soundcloudReposts, percentage: 85.4 },
    { step: 'Downloads', count: gate.stats.downloads, percentage: 85.3 }
  ]}
/>
```

**Tab 2: Submissions**
```tsx
<DataTable
  columns={[
    { key: 'email', label: 'Email' },
    { key: 'firstName', label: 'Name' },
    { key: 'createdAt', label: 'Date' },
    { key: 'soundcloudRepostVerified', label: 'Repost', render: (val) => val ? '✅' : '⏳' },
    { key: 'soundcloudFollowVerified', label: 'Follow', render: (val) => val ? '✅' : '⏳' },
    { key: 'spotifyConnected', label: 'Spotify', render: (val) => val ? '✅' : '—' },
    { key: 'downloadCompleted', label: 'Downloaded', render: (val) => val ? '✅' : '❌' }
  ]}
  data={submissions}
  pagination={true}
  filters={[
    { key: 'downloaded', label: 'Downloaded Only' },
    { key: 'notDownloaded', label: 'Not Downloaded' },
    { key: 'spotifyConnected', label: 'Spotify Connected' }
  ]}
/>

<Button onClick={exportToCSV}>
  Export to CSV
</Button>
```

**Tab 3: Edit Settings**
```tsx
<EditGateForm
  gate={gate}
  onSave={handleUpdate}
/>

<DangerZone>
  <Button
    variant="danger"
    onClick={handleDelete}
    confirm="Are you sure? This will delete all submissions and analytics."
  >
    Delete Gate
  </Button>
</DangerZone>
```

---

## 2. Public Landing Page (Unauthenticated)

### Ruta

```
/gate/[slug]                        → Download gate landing page
```

---

### 2.1 Landing Page (`/gate/[slug]`)

**Componente**: `app/gate/[slug]/page.tsx`

**Layout** (Single Page Application con estado):

```tsx
export default function DownloadGatePage({ params }: { params: { slug: string } }) {
  const [gate, setGate] = useState<DownloadGate | null>(null);
  const [submission, setSubmission] = useState<DownloadSubmission | null>(null);
  const [currentStep, setCurrentStep] = useState<'email' | 'repost' | 'follow' | 'spotify' | 'download'>('email');

  // Fetch gate config on mount
  useEffect(() => {
    fetchGate();
    loadSubmissionFromLocalStorage(); // Resume if user already started
  }, []);

  const fetchGate = async () => {
    const res = await fetch(`/api/gate/${params.slug}`);
    const data = await res.json();
    setGate(data);
  };

  return (
    <PublicLayout>
      <DownloadGateHero
        title={gate.title}
        artworkUrl={gate.artworkUrl}
        artistName={gate.artistName}
      />

      <DownloadProgressTracker
        steps={getSteps(gate)}
        currentStep={currentStep}
      />

      {currentStep === 'email' && (
        <EmailCaptureForm
          onSubmit={handleEmailSubmit}
        />
      )}

      {currentStep === 'repost' && (
        <SoundCloudVerifyButton
          action="repost"
          onVerified={() => setCurrentStep('follow')}
        />
      )}

      {currentStep === 'follow' && (
        <SoundCloudVerifyButton
          action="follow"
          onVerified={() => setCurrentStep('spotify')}
        />
      )}

      {currentStep === 'spotify' && (
        <SpotifyConnectButton
          optional={true}
          onConnected={() => setCurrentStep('download')}
          onSkip={() => setCurrentStep('download')}
        />
      )}

      {currentStep === 'download' && (
        <DownloadUnlockButton
          submissionId={submission.id}
        />
      )}
    </PublicLayout>
  );
}
```

---

### 2.2 Components Breakdown

#### `<DownloadGateHero />`

**Responsabilidad**: Mostrar artwork + título del track

```tsx
interface DownloadGateHeroProps {
  title: string;
  artworkUrl: string;
  artistName: string;
}

export function DownloadGateHero({ title, artworkUrl, artistName }: DownloadGateHeroProps) {
  return (
    <div className="hero">
      <div className="artwork">
        <img src={artworkUrl} alt={title} />
        <div className="play-button">
          <PlayIcon />
        </div>
      </div>

      <div className="info">
        <h1>{title}</h1>
        <p className="artist">{artistName}</p>
        <p className="cta">Download this track for free by completing the steps below</p>
      </div>
    </div>
  );
}
```

**Estilo** (ejemplo con Tailwind):
```tsx
<div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-gradient-to-br from-purple-900 to-blue-900 text-white rounded-lg">
  <div className="relative w-64 h-64">
    <img src={artworkUrl} className="w-full h-full object-cover rounded-lg shadow-2xl" />
    <button className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-lg transition">
      <PlayIcon className="w-16 h-16" />
    </button>
  </div>

  <div className="text-center md:text-left">
    <h1 className="text-4xl font-bold mb-2">{title}</h1>
    <p className="text-xl text-purple-200 mb-4">{artistName}</p>
    <p className="text-lg opacity-90">
      🎁 Download this track for free by completing the steps below
    </p>
  </div>
</div>
```

---

#### `<DownloadProgressTracker />`

**Responsabilidad**: Mostrar progreso visual de los pasos

```tsx
interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface DownloadProgressTrackerProps {
  steps: Step[];
  currentStep: string;
}

export function DownloadProgressTracker({ steps, currentStep }: DownloadProgressTrackerProps) {
  return (
    <div className="progress-tracker">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
        >
          <div className="step-indicator">
            {step.completed ? (
              <CheckIcon className="text-green-500" />
            ) : (
              <span className="step-number">{index + 1}</span>
            )}
          </div>

          <div className="step-label">{step.label}</div>

          {index < steps.length - 1 && (
            <div className={`connector ${step.completed ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}
```

**Visual Example**:
```
[✅ Email]━━━━[✅ Repost]━━━━[🔵 Follow]━━━━[⚪ Download]
  Completed     Completed      Current       Pending
```

**Estilo**:
```tsx
<div className="flex items-center justify-center gap-4 my-8">
  {/* Step 1: Completed */}
  <div className="flex flex-col items-center">
    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
      <CheckIcon />
    </div>
    <span className="text-sm mt-2 text-green-600 font-semibold">Email</span>
  </div>

  {/* Connector */}
  <div className="w-16 h-1 bg-green-500" />

  {/* Step 2: Current */}
  <div className="flex flex-col items-center">
    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white animate-pulse">
      <span className="font-bold">2</span>
    </div>
    <span className="text-sm mt-2 text-blue-600 font-semibold">Repost</span>
  </div>

  {/* Connector */}
  <div className="w-16 h-1 bg-gray-300" />

  {/* Step 3: Pending */}
  <div className="flex flex-col items-center">
    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
      <span className="font-bold">3</span>
    </div>
    <span className="text-sm mt-2 text-gray-600">Follow</span>
  </div>

  {/* ... */}
</div>
```

---

#### `<EmailCaptureForm />`

**Responsabilidad**: Capturar email + nombre del fan

```tsx
interface EmailCaptureFormProps {
  onSubmit: (data: { email: string; firstName: string; consentMarketing: boolean }) => Promise<void>;
}

export function EmailCaptureForm({ onSubmit }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({ email, firstName, consentMarketing });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="email-form">
      <h2>Step 1: Enter Your Email</h2>
      <p>We'll send you updates about new releases (you can unsubscribe anytime)</p>

      <Input
        type="text"
        label="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="John"
        required
      />

      <Input
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="john@example.com"
        required
      />

      <Checkbox
        checked={consentMarketing}
        onChange={(e) => setConsentMarketing(e.target.checked)}
        label="I want to receive emails about new releases and exclusive content"
      />

      <p className="text-xs text-gray-500">
        By submitting, you agree to our{' '}
        <a href="/privacy" className="underline">Privacy Policy</a>.
        You can unsubscribe at any time.
      </p>

      <Button
        type="submit"
        loading={loading}
        disabled={!email || !firstName}
        size="large"
        fullWidth
      >
        Continue to Next Step
      </Button>
    </form>
  );
}
```

**API Call** (en parent component):
```typescript
const handleEmailSubmit = async ({ email, firstName, consentMarketing }) => {
  const response = await fetch(`/api/gate/${gate.slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      firstName,
      consentMarketing,
      sessionId: getOrCreateSessionId(), // For analytics
      referrer: document.referrer,
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCampaign: searchParams.get('utm_campaign')
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const submission = await response.json();

  // Save to localStorage (resume if user refreshes)
  localStorage.setItem('download_gate_submission', JSON.stringify(submission));

  setSubmission(submission);
  setCurrentStep('repost'); // Move to next step
};
```

---

#### `<SoundCloudVerifyButton />`

**Responsabilidad**: Iniciar OAuth flow de SoundCloud

```tsx
interface SoundCloudVerifyButtonProps {
  action: 'repost' | 'follow';
  submissionId: string;
  onVerified: () => void;
}

export function SoundCloudVerifyButton({ action, submissionId, onVerified }: SoundCloudVerifyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // Check verification status on mount (user may have already completed)
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  // Listen for OAuth callback (via postMessage from popup)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth_success' && event.data.action === action) {
        setVerified(true);
        onVerified();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClick = async () => {
    setLoading(true);

    try {
      // Request OAuth URL from backend
      const response = await fetch('/api/gate/oauth/soundcloud/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action // 'repost' or 'follow'
        })
      });

      const { authUrl, state } = await response.json();

      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'SoundCloud OAuth',
        'width=600,height=700,left=100,top=100'
      );

      // Poll popup to detect when it closes
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setLoading(false);

          // Check if verification succeeded
          checkVerificationStatus();
        }
      }, 500);

    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    const response = await fetch(`/api/gate/submission/${submissionId}`);
    const submission = await response.json();

    if (action === 'repost' && submission.soundcloudRepostVerified) {
      setVerified(true);
      onVerified();
    } else if (action === 'follow' && submission.soundcloudFollowVerified) {
      setVerified(true);
      onVerified();
    }
  };

  if (verified) {
    return (
      <div className="verified-badge">
        <CheckCircleIcon className="text-green-500 w-8 h-8" />
        <span>
          {action === 'repost' ? 'Repost Verified!' : 'Follow Verified!'}
        </span>
      </div>
    );
  }

  return (
    <div className="verify-step">
      <h2>
        Step {action === 'repost' ? '2' : '3'}:
        {action === 'repost' ? ' Repost on SoundCloud' : ' Follow on SoundCloud'}
      </h2>

      <p className="instructions">
        {action === 'repost'
          ? 'Click the button below to repost this track on your SoundCloud profile'
          : 'Follow us on SoundCloud to unlock the download'
        }
      </p>

      <Button
        onClick={handleClick}
        loading={loading}
        icon={<SoundCloudIcon />}
        size="large"
        variant="soundcloud"
      >
        {action === 'repost' ? 'Repost on SoundCloud' : 'Follow on SoundCloud'}
      </Button>

      <p className="help-text">
        You'll be redirected to SoundCloud to authorize.
        We'll verify automatically after you {action === 'repost' ? 'repost' : 'follow'}.
      </p>
    </div>
  );
}
```

**Flujo OAuth**:
```
1. User clicks button
   ↓
2. POST /api/gate/oauth/soundcloud/initiate { submissionId, action }
   ↓
3. Backend returns { authUrl, state }
   ↓
4. Open popup: window.open(authUrl, ...)
   ↓
5. User authorizes on SoundCloud
   ↓
6. SoundCloud redirects to: /api/gate/oauth/soundcloud/callback?code=XXX&state=YYY
   ↓
7. Backend verifies repost/follow via API
   ↓
8. Backend updates download_submissions.soundcloud_repost_verified = true
   ↓
9. Backend redirects popup to: /gate/oauth/success?action=repost
   ↓
10. Success page sends postMessage to parent: window.opener.postMessage({ type: 'oauth_success', action: 'repost' })
   ↓
11. Parent component receives message → setVerified(true) → onVerified()
```

---

#### `<SpotifyConnectButton />`

**Responsabilidad**: Conectar Spotify (opcional)

```tsx
interface SpotifyConnectButtonProps {
  submissionId: string;
  optional: boolean;
  onConnected: () => void;
  onSkip: () => void;
}

export function SpotifyConnectButton({ submissionId, optional, onConnected, onSkip }: SpotifyConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Similar OAuth flow as SoundCloud
  const handleConnect = async () => {
    // ... same pattern as SoundCloud
  };

  if (connected) {
    return (
      <div className="verified-badge">
        <CheckCircleIcon className="text-green-500 w-8 h-8" />
        <span>Spotify Connected!</span>
      </div>
    );
  }

  return (
    <div className="verify-step">
      <h2>Step 4: Connect Spotify {optional && '(Optional)'}</h2>

      {optional && (
        <div className="bonus-badge">
          <StarIcon className="text-yellow-500" />
          <span>Bonus: Get exclusive updates on Spotify</span>
        </div>
      )}

      <Button
        onClick={handleConnect}
        loading={loading}
        icon={<SpotifyIcon />}
        size="large"
        variant="spotify"
      >
        Connect Spotify
      </Button>

      {optional && (
        <Button
          onClick={onSkip}
          variant="ghost"
          size="large"
        >
          Skip for now
        </Button>
      )}
    </div>
  );
}
```

---

#### `<DownloadUnlockButton />`

**Responsabilidad**: Generar token y descargar archivo

```tsx
interface DownloadUnlockButtonProps {
  submissionId: string;
  gateSlug: string;
}

export function DownloadUnlockButton({ submissionId, gateSlug }: DownloadUnlockButtonProps) {
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Generate download token on mount
  useEffect(() => {
    generateToken();
  }, []);

  const generateToken = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/gate/${gateSlug}/download-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      });

      const { token, expiresAt } = await response.json();

      setDownloadToken(token);

      // Start countdown (24h expiry)
      const expiryTime = new Date(expiresAt).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, expiryTime - now);
        setCountdown(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

    } catch (error) {
      toast.error('Failed to generate download link');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadToken) return;

    // Track download analytics
    fetch(`/api/gate/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'download',
        submissionId,
        sessionId: getSessionId()
      })
    });

    // Redirect to download endpoint (which redirects to actual file)
    window.location.href = `/api/download/${downloadToken}`;
  };

  return (
    <div className="download-unlock">
      <div className="success-animation">
        <CheckCircleIcon className="w-24 h-24 text-green-500 animate-bounce" />
      </div>

      <h2 className="text-3xl font-bold text-center">
        🎉 Congratulations!
      </h2>

      <p className="text-center text-lg mb-8">
        You've unlocked the download. Click below to get your track!
      </p>

      <Button
        onClick={handleDownload}
        loading={loading}
        disabled={!downloadToken}
        icon={<DownloadIcon />}
        size="large"
        variant="success"
        className="w-full max-w-md"
      >
        Download Track
      </Button>

      {countdown !== null && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          This link expires in {formatCountdown(countdown)}
        </p>
      )}

      <div className="social-share mt-8">
        <p className="text-center text-sm text-gray-600 mb-4">
          Enjoying the track? Share it with your friends!
        </p>

        <ShareButtons
          url={`https://geebeat.com/gate/${gateSlug}`}
          title="Check out this free download!"
          platforms={['twitter', 'facebook', 'whatsapp']}
        />
      </div>
    </div>
  );
}
```

---

## 3. Shared Components

### `<Button />`

```tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'soundcloud' | 'spotify' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  loading,
  disabled,
  variant = 'primary',
  size = 'medium',
  icon,
  fullWidth,
  type = 'button'
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-semibold transition flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    soundcloud: 'bg-orange-500 hover:bg-orange-600 text-white',
    spotify: 'bg-green-500 hover:bg-green-600 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
```

### `<Input />`

```tsx
interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'textarea' | 'datetime-local';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
  required,
  disabled
}: InputProps) {
  const Component = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <Component
        id={name}
        name={name}
        type={type !== 'textarea' ? type : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={type === 'textarea' ? 4 : undefined}
      />

      {hint && (
        <p className="text-sm text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  );
}
```

---

## 4. State Management

### Local Storage (Resume Flow)

```typescript
// Save submission to localStorage (persist across page refreshes)
const saveSubmission = (submission: DownloadSubmission) => {
  localStorage.setItem(
    `download_gate_${gateSlug}`,
    JSON.stringify({
      submissionId: submission.id,
      email: submission.email,
      firstName: submission.firstName,
      soundcloudRepostVerified: submission.soundcloudRepostVerified,
      soundcloudFollowVerified: submission.soundcloudFollowVerified,
      spotifyConnected: submission.spotifyConnected,
      downloadToken: submission.downloadToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    })
  );
};

// Load submission from localStorage on page load
const loadSubmission = (): DownloadSubmission | null => {
  const stored = localStorage.getItem(`download_gate_${gateSlug}`);
  if (!stored) return null;

  const data = JSON.parse(stored);

  // Check if expired
  if (new Date(data.expiresAt) < new Date()) {
    localStorage.removeItem(`download_gate_${gateSlug}`);
    return null;
  }

  return data;
};
```

### Session ID (Analytics)

```typescript
// Generate or retrieve session ID (for analytics tracking)
const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('download_gate_session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('download_gate_session_id', sessionId);
  }

  return sessionId;
};
```

---

## 5. Analytics Tracking

### Track Page Views

```typescript
useEffect(() => {
  // Track gate view
  fetch('/api/gate/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gateId: gate.id,
      eventType: 'view',
      sessionId: getOrCreateSessionId(),
      referrer: document.referrer,
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCampaign: searchParams.get('utm_campaign')
    })
  });
}, [gate]);
```

### Track Step Completions

```typescript
const trackStepCompletion = (step: 'email' | 'repost' | 'follow' | 'spotify' | 'download') => {
  fetch('/api/gate/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gateId: gate.id,
      eventType: `verify_${step}`,
      sessionId: getOrCreateSessionId(),
      submissionId: submission?.id
    })
  });
};
```

---

## 6. Error Handling & UX

### Toast Notifications

```typescript
import { toast } from 'react-hot-toast';

// Success
toast.success('Email submitted successfully!');

// Error
toast.error('Failed to verify repost. Please try again.');

// Loading
const toastId = toast.loading('Verifying repost...');
// ... after verification
toast.success('Repost verified!', { id: toastId });
```

### Loading States

```tsx
{loading ? (
  <div className="flex items-center justify-center p-12">
    <LoadingSpinner size="large" />
    <span className="ml-3 text-gray-600">Loading gate...</span>
  </div>
) : (
  <GateContent />
)}
```

### Error Boundaries

```tsx
class DownloadGateErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Oops! Something went wrong</h1>
          <p>{this.state.error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 7. Mobile Responsiveness

### Responsive Layouts

```tsx
{/* Desktop: Side-by-side, Mobile: Stacked */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <DownloadGateHero />
  <EmailCaptureForm />
</div>

{/* Mobile-first progress tracker */}
<div className="flex flex-col md:flex-row items-center gap-4">
  {steps.map(step => (
    <StepIndicator key={step.id} {...step} />
  ))}
</div>
```

### Mobile-Optimized OAuth

```typescript
// On mobile, use full redirect instead of popup
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Save current state to localStorage (to resume after redirect)
  localStorage.setItem('oauth_return_url', window.location.href);

  // Full page redirect
  window.location.href = authUrl;
} else {
  // Desktop: popup window
  window.open(authUrl, 'OAuth', 'width=600,height=700');
}
```

---

## 8. SEO & Meta Tags

### Dynamic Meta Tags

```tsx
// app/gate/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const gate = await fetchGate(params.slug);

  return {
    title: `${gate.title} - Free Download | ${gate.artistName}`,
    description: `Download "${gate.title}" by ${gate.artistName} for free. Just repost, follow, and enjoy!`,
    openGraph: {
      title: gate.title,
      description: `Free download: ${gate.title}`,
      images: [gate.artworkUrl],
      type: 'music.song',
      url: `https://geebeat.com/gate/${gate.slug}`
    },
    twitter: {
      card: 'summary_large_image',
      title: gate.title,
      description: 'Free download available now!',
      images: [gate.artworkUrl]
    }
  };
}
```

---

## 9. Accessibility

### ARIA Labels

```tsx
<button
  aria-label="Repost track on SoundCloud"
  aria-describedby="repost-instructions"
  onClick={handleRepost}
>
  Repost on SoundCloud
</button>

<p id="repost-instructions" className="sr-only">
  Clicking this button will open SoundCloud in a new window where you can repost the track.
</p>
```

### Keyboard Navigation

```tsx
<div
  role="progressbar"
  aria-valuenow={currentStepIndex}
  aria-valuemin={0}
  aria-valuemax={totalSteps}
  aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}
>
  {/* Progress indicator */}
</div>
```

---

## 10. Performance Optimization

### Code Splitting

```tsx
// Lazy load heavy components
const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src={gate.artworkUrl}
  alt={gate.title}
  width={400}
  height={400}
  priority
  className="rounded-lg"
/>
```

---

## Summary

**DJ Dashboard**: 3 rutas principales para gestionar gates
**Public Landing Page**: 1 ruta con flujo multi-step (email → OAuth → download)
**Shared Components**: Button, Input, Progress Tracker, etc.
**State Management**: localStorage para resume, sessionId para analytics
**OAuth Flow**: Popup (desktop) + full redirect (mobile)
**Analytics**: Track views, submissions, verifications, downloads
**Mobile-First**: Responsive layouts + mobile-optimized OAuth
**SEO**: Dynamic meta tags para cada gate
**Accessibility**: ARIA labels + keyboard navigation

---

¿Listo para que desarrolle el backend con agentes?
