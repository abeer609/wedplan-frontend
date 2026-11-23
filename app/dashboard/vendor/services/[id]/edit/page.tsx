"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { authed } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { ServiceForm } from "../../new/page";
import type { Service } from "@/lib/constants";

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["vendor-service", id],
    queryFn: () => authed<{ data: Service }>(`/services/${id}`).then((r) => r.data),
    retry: false,
  });

  if (isPending) return <PageLoader label="Loading service…" />;
  if (isError || !data) {
    return (
      <EmptyState
        title="Couldn't load this service"
        message="It may have been removed."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-soft hover:text-charcoal">
        <ArrowLeft className="size-4" /> Back
      </button>
      <PageHeader
        eyebrow="Vendor dashboard"
        title="Edit service"
        description={data.serviceName}
        action={<Link href={`/services/${data._id}`}><Button variant="outline">Preview</Button></Link>}
      />
      <ServiceForm
        serviceId={data._id}
        initial={{
          serviceName: data.serviceName,
          category: data.category,
          description: data.description,
          price: data.price,
          location: data.location,
          images: data.images,
        }}
      />
    </div>
  );
}
