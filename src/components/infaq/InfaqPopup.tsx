 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Heart, Copy, X, MessageCircle } from "lucide-react";
 import { toast } from "sonner";
 
 interface InfaqPopupData {
   id: string;
   title: string;
   description: string | null;
   image_url: string | null;
   bank_name: string | null;
   account_number: string | null;
   account_holder: string | null;
   whatsapp_number: string | null;
   is_active: boolean;
 }
 
 export const InfaqPopup = () => {
   const [open, setOpen] = useState(false);
   const [popupData, setPopupData] = useState<InfaqPopupData | null>(null);
   const [hasShown, setHasShown] = useState(false);
 
   useEffect(() => {
     const fetchPopup = async () => {
       const { data } = await supabase
         .from("infaq_popup")
         .select("*")
         .eq("is_active", true)
         .limit(1)
         .single();
 
       if (data) {
         setPopupData(data as InfaqPopupData);
       }
     };
 
     fetchPopup();
   }, []);
 
   useEffect(() => {
     // Show popup after 3 seconds, but only once per session
     if (popupData && !hasShown) {
       const timer = setTimeout(() => {
         const hasSeenToday = sessionStorage.getItem("infaq_popup_shown");
         if (!hasSeenToday) {
           setOpen(true);
           setHasShown(true);
           sessionStorage.setItem("infaq_popup_shown", "true");
         }
       }, 3000);
 
       return () => clearTimeout(timer);
     }
   }, [popupData, hasShown]);
 
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast.success("Nomor rekening disalin!");
   };
 
   const openWhatsApp = () => {
     if (popupData?.whatsapp_number) {
       const cleanNumber = popupData.whatsapp_number.replace(/\D/g, '');
       const message = encodeURIComponent("Assalamu'alaikum, saya ingin berinfak.");
       window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
     }
   };
 
   if (!popupData) return null;
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
         {/* Header with gradient */}
         <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-center text-primary-foreground">
           <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
             <Heart className="w-8 h-8" />
           </div>
           <DialogHeader>
             <DialogTitle className="text-xl font-bold text-primary-foreground">
               {popupData.title}
             </DialogTitle>
           </DialogHeader>
           {popupData.description && (
             <p className="text-sm mt-2 opacity-90">{popupData.description}</p>
           )}
         </div>
 
         {/* Content */}
         <div className="p-6 space-y-4">
           {popupData.image_url && (
             <img 
               src={popupData.image_url} 
               alt="Infaq" 
               className="w-full h-32 object-cover rounded-lg"
             />
           )}
 
           {/* Bank Info */}
           {popupData.bank_name && (
             <div className="bg-muted rounded-lg p-4 space-y-2">
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                 Transfer Bank
               </p>
               <p className="font-semibold text-foreground">{popupData.bank_name}</p>
               {popupData.account_number && (
                 <div className="flex items-center justify-between gap-2 bg-background rounded-md p-3">
                   <span className="font-mono text-lg font-bold text-primary">
                     {popupData.account_number}
                   </span>
                   <Button 
                     size="sm" 
                     variant="ghost"
                     onClick={() => copyToClipboard(popupData.account_number!)}
                   >
                     <Copy className="w-4 h-4" />
                   </Button>
                 </div>
               )}
               {popupData.account_holder && (
                 <p className="text-sm text-muted-foreground">
                   a.n. {popupData.account_holder}
                 </p>
               )}
             </div>
           )}
 
           {/* Actions */}
           <div className="flex gap-2">
             {popupData.whatsapp_number && (
               <Button 
                 className="flex-1 gap-2" 
                 onClick={openWhatsApp}
               >
                 <MessageCircle className="w-4 h-4" />
                 Konfirmasi via WA
               </Button>
             )}
             <Button 
               variant="outline" 
               onClick={() => setOpen(false)}
               className={popupData.whatsapp_number ? "" : "w-full"}
             >
               Tutup
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };