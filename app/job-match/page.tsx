import { permanentRedirect } from 'next/navigation';

export default function JobMatchRedirect() {
  permanentRedirect('/jobs');
}
