import { memo, useState } from "react";
import {
  DefMirrors,
  AutoComplete,
  AutoCompleteProps,
  Button,
  LabelCopyable,
  RadioGroup,
  RadioGroupItem,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  IpInput,
  Input,
  Switch,
  SheetDescription
} from "@renderer/components/ui";
import { GearIcon, InfoCircledIcon, Pencil2Icon } from "@radix-ui/react-icons";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select
} from "@renderer/components/ui";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppContext, useI18n } from "@src/renderer/src/app-context";
import { Closer, Themes } from "@src/types";
import { compareObject } from "../../util";

type Options = NonNullable<AutoCompleteProps["options"]>;

type Props = {};

const formSchema = z.object({
  locale: z.string(),
  theme: z.nativeEnum(Themes),
  closer: z.nativeEnum(Closer),
  directory: z.string().min(1),
  mirror: z.string().url({ message: "Invalid mirror url" }),
  proxy: z
    .object({
      enabled: z.boolean().default(false),
      ip: z.string().ip({ message: "Invalid ip" }).optional().or(z.literal("")),
      port: z.string().regex(/^\d+$/, "Invalid port").optional().or(z.literal(""))
    })
    .superRefine((val, ctx) => {
      if (val.enabled && (val.ip === "" || val.ip === void 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ip"],
          message: "Invalid ip"
        });
      }

      if (val.enabled && (val.port === "" || val.port === "0" || val.port === void 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["port"],
          message: "Invalid port"
        });
      }
    })
});

export const Setting: React.FC<Props> = memo(() => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [options, setOptions] = useState<Options>(() => {
    const optStr = localStorage.getItem("nvmd-mirror");
    return optStr ? optStr.split("__") : [];
  });

  const { locale, theme, closer, directory, mirror, proxy, onUpdateSetting } = useAppContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locale,
      theme,
      closer,
      directory,
      mirror,
      proxy
    }
  });

  const i18n = useI18n();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const {
      locale: newLocale,
      theme: newTheme,
      closer: newCloser,
      directory: newDirectory,
      mirror: newMirror,
      proxy: newProxy
    } = values;
    if (
      locale === newLocale &&
      theme === newTheme &&
      closer === newCloser &&
      directory === newDirectory &&
      mirror === newMirror &&
      compareObject(proxy, newProxy)
    ) {
      setLoading(false);
      setOpen(false);
      return;
    }

    // for custom mirror url
    // if not exesit need to cache
    if (![...DefMirrors, ...options].includes(newMirror)) {
      setOptions((pre) => {
        let newOptions = [...pre];
        newOptions.unshift(newMirror);
        // max cache 5
        newOptions = newOptions.slice(0, 5);
        localStorage.setItem("nvmd-mirror", newOptions.join("__"));

        return newOptions;
      });
    }

    try {
      await onUpdateSetting({
        locale: newLocale,
        theme: newTheme,
        closer: newCloser,
        directory: newDirectory,
        mirror: newMirror,
        proxy: newProxy
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        form.reset({
          locale,
          theme,
          closer,
          directory,
          mirror,
          proxy
        });
        setOpen(open);
      }}
    >
      <SheetTrigger asChild>
        <Button
          className="nvmd-setting"
          data-testid="setting-trigger"
          size="sm"
          title={i18n("Setting")}
          variant="ghost"
          icon={<GearIcon />}
        />
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{i18n("Setting")}</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6">
          <Form {...form}>
            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{i18n("Language")}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="language-trigger" className="w-44 h-8">
                          <SelectValue
                            data-testid="language-value"
                            placeholder="Select a language to display"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem data-testid="language-item" value="zh-CN">
                          简体中文
                        </SelectItem>
                        <SelectItem data-testid="language-item" value="en">
                          English
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-muted-foreground">{i18n("Themes")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={Themes.System} />
                        </FormControl>
                        <FormLabel className="font-normal">{i18n("System-Default")}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={Themes.Light} />
                        </FormControl>
                        <FormLabel className="font-normal">{i18n("Light")}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={Themes.Dark} />
                        </FormControl>
                        <FormLabel className="font-normal">{i18n("Dark")}</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="closer"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-muted-foreground">{i18n("When-Closing")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={Closer.Minimize} />
                        </FormControl>
                        <FormLabel className="font-normal">{i18n("Minimize-Window")}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={Closer.Close} />
                        </FormControl>
                        <FormLabel className="font-normal">{i18n("Quit-App")}</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="directory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1 text-muted-foreground">
                    {i18n("Installation-Directory")}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoCircledIcon className="text-primary cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="w-96 text-accent-foreground bg-accent">
                        {i18n("Installation-Directory-tip")}
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-between">
                      <Tooltip delayDuration={700}>
                        <TooltipTrigger asChild>
                          <LabelCopyable className="max-w-64 leading-5 truncate">
                            {field.value}
                          </LabelCopyable>
                        </TooltipTrigger>
                        <TooltipContent className="text-accent-foreground bg-accent">
                          {field.value}
                        </TooltipContent>
                      </Tooltip>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil2Icon />}
                        onClick={async () => {
                          const { canceled, filePaths } = await window.Context.openFolderSelecter({
                            title: i18n("Directory-Select")
                          });

                          if (canceled) return;

                          const [path] = filePaths;
                          field.onChange(path);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mirror"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{i18n("Mirror-Url")}</FormLabel>
                  <FormControl>
                    <AutoComplete
                      value={field.value}
                      shouldFilter={false}
                      placeholder="mirror url"
                      options={options}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>{i18n("Mirror-Tip")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proxy"
              render={({ field }) => {
                const { enabled } = field.value;
                return (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">{i18n("Proxy")}</FormLabel>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="proxy.enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormDescription className="!mt-0">
                              {i18n(field.value ? "Enabled" : "Disabled")}
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name="proxy.ip"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <IpInput disabled={!enabled} {...field} />
                              </FormControl>
                              <FormMessage className="absolute !mt-1" />
                            </FormItem>
                          )}
                        />
                        <span>:</span>
                        <FormField
                          control={form.control}
                          name="proxy.port"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="w-[72px] h-8 text-center"
                                  disabled={!enabled}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="absolute !mt-1" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </FormItem>
                );
              }}
            />
          </Form>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="secondary">{i18n("Cancel")}</Button>
          </SheetClose>
          <Button
            data-testid="setting-submit"
            loading={loading}
            onClick={form.handleSubmit(onSubmit)}
          >
            {i18n("OK")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});
