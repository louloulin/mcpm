import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { 
  ShieldIcon, 
  LockIcon, 
  KeyIcon,
  ArrowLeftIcon 
} from 'lucide-react';

export const metadata: Metadata = {
  title: '企业SSO登录 | MCPM',
  description: '使用企业单点登录访问MCPM平台',
};

export default function SSOPage() {
  return (
    <div className="container py-8">
      <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeftIcon size={16} className="mr-1" />
        返回首页
      </Link>
      
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <ShieldIcon className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">企业SSO登录</CardTitle>
            <CardDescription className="text-center">
              使用您的企业身份提供商登录MCPM平台
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">企业邮箱</Label>
              <Input id="email" type="email" placeholder="company@example.com" />
              <p className="text-xs text-muted-foreground">
                输入您的企业邮箱以继续SSO登录流程
              </p>
            </div>
            
            <Button className="w-full">继续</Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  或选择SSO提供商
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <img src="/okta-logo.svg" alt="Okta" className="h-4 w-4" />
                Okta
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <img src="/azure-ad-logo.svg" alt="Azure AD" className="h-4 w-4" />
                Azure AD
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <img src="/google-logo.svg" alt="Google" className="h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <LockIcon className="h-4 w-4" />
                SAML
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
              <p>
                没有企业SSO?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  标准登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium text-center">企业SSO功能</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <LockIcon className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-medium text-center">集中身份管理</h4>
              <p className="text-sm text-center text-muted-foreground">
                管理员可在企业SSO中集中管理用户身份和权限
              </p>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <KeyIcon className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-medium text-center">高级安全策略</h4>
              <p className="text-sm text-center text-muted-foreground">
                支持MFA、条件访问策略和安全审计
              </p>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <ShieldIcon className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-medium text-center">团队协作管理</h4>
              <p className="text-sm text-center text-muted-foreground">
                基于组织结构自动管理团队权限
              </p>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <LockIcon className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-medium text-center">合规与审计</h4>
              <p className="text-sm text-center text-muted-foreground">
                满足企业级安全合规需求
              </p>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <Link href="/enterprise/contact">
              <Button variant="outline">联系销售了解更多企业功能</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 