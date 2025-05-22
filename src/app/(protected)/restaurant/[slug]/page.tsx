// app/restaurant/[slug]/page.tsx
export default function RestaurantPage({ params }: { params: { slug: string } }) {
    return <div>{params.slug}</div>;
}