import { Link, Meta, Title } from '@solidjs/meta';
import type { Graph } from 'schema-dts';
import {
  canonicalUrl,
  SHARE_IMAGE_ALT,
  SHARE_IMAGE_HEIGHT_FALLBACK,
  SHARE_IMAGE_URL,
  SHARE_IMAGE_WIDTH_FALLBACK,
  SITE_NAME,
  TWITTER_HANDLE,
} from '../lib/seo';
import StructuredData from './StructuredData';

type PageMetaProps = {
  path: string;
  title: string;
  description: string;
  canonicalPath?: string;
  noindex?: boolean;
  structuredData?: Graph;
};

export default function PageMeta(props: PageMetaProps) {
  const canonical = () => canonicalUrl(props.canonicalPath ?? props.path);
  return (
    <>
      <Title>{props.title}</Title>
      <Meta name="description" content={props.description} />
      <Meta name="robots" content={props.noindex ? 'noindex, follow' : 'index, follow'} />
      <Link rel="canonical" href={canonical()} />
      <Meta property="og:title" content={props.title} />
      <Meta property="og:description" content={props.description} />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content={canonical()} />
      <Meta property="og:site_name" content={SITE_NAME} />
      <Meta property="og:image" content={SHARE_IMAGE_URL} />
      <Meta property="og:image:width" content={String(SHARE_IMAGE_WIDTH_FALLBACK)} />
      <Meta property="og:image:height" content={String(SHARE_IMAGE_HEIGHT_FALLBACK)} />
      <Meta property="og:image:alt" content={SHARE_IMAGE_ALT} />
      <Meta name="twitter:card" content="summary" />
      <Meta name="twitter:site" content={TWITTER_HANDLE} />
      <Meta name="twitter:creator" content={TWITTER_HANDLE} />
      {props.structuredData && <StructuredData graph={props.structuredData} />}
    </>
  );
}
