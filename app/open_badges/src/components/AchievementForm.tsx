import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from "@/hooks/useTranslation";

// Achievement form schema based on Open Badges 3.0
const achievementFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  criteria: z.object({
    narrative: z.string().min(10, "Criteria must be at least 10 characters"),
    id: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  }),
  tags: z.string().optional(),
});

type AchievementFormValues = z.infer<typeof achievementFormSchema>;

interface AchievementFormProps {
  initialValues?: Partial<AchievementFormValues>;
  onSubmit: (values: AchievementFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function AchievementForm({ 
  initialValues, 
  onSubmit, 
  isLoading = false,
  submitLabel
}: AchievementFormProps) {
  const { tAchievements, tCommon, tForms } = useTranslation();
  const [preview, setPreview] = useState<string | null>(initialValues?.image || null);

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementFormSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      image: initialValues?.image || "",
      criteria: {
        narrative: initialValues?.criteria?.narrative || "",
        id: initialValues?.criteria?.id || "",
      },
      tags: initialValues?.tags || "",
    },
  });

  const handleImageChange = (url: string) => {
    setPreview(url);
    form.setValue("image", url);
  };

  const clearImage = () => {
    setPreview(null);
    form.setValue("image", "");
  };

  const handleSubmit = (values: AchievementFormValues) => {
    // Parse tags from comma-separated string
    const processedValues = {
      ...values,
      parsedTags: values.tags 
        ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : undefined
    };
    onSubmit(processedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAchievements('form.nameRequired')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={tForms('placeholders.enterName')}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                A concise name for this achievement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAchievements('form.descriptionRequired')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={tForms('placeholders.enterDescription')}
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {tAchievements('form.descriptionPlaceholder')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="criteria.narrative"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAchievements('form.criteriaRequired')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={tAchievements('form.criteriaPlaceholder')}
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {tAchievements('form.criteriaHelp')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="criteria.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAchievements('form.criteriaUrl')}</FormLabel>
              <FormControl>
                <Input 
                  type="url"
                  placeholder={tAchievements('form.criteriaUrlPlaceholder')}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {tAchievements('form.criteriaUrlHelp')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAchievements('form.imageOptional')}</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input 
                    type="url"
                    placeholder={tAchievements('form.imageUrlPlaceholder')}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleImageChange(e.target.value);
                    }}
                  />
                  
                  {preview && (
                    <div className="relative inline-block">
                      <img 
                        src={preview} 
                        alt="Achievement preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={() => {
                          setPreview(null);
                          form.setValue("image", "");
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={clearImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {tAchievements('form.imageDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAchievements('form.tagsOptional')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={tAchievements('form.tagsPlaceholder')}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {tAchievements('form.tagsDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tAchievements('form.creating')}...
              </>
            ) : (
              submitLabel || tAchievements('form.createAchievement')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
