import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      expand={true}
      closeButton={true}
      duration={4000}
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",

          description:
            "group-[.toast]:text-muted-foreground",

          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",

          closeButton:
            "!absolute !right-2 !top-2 !z-10 !size-6 !min-h-6 !min-w-6 !max-h-6 !max-w-6 !shrink-0 !p-0 !m-0 !aspect-square !rounded-md !border !border-border/60 !bg-background/80 !text-muted-foreground hover:!bg-muted hover:!text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };