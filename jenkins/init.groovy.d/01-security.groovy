import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import hudson.security.HudsonPrivateSecurityRealm
import jenkins.model.Jenkins

def instance = Jenkins.get()
def adminId = System.getenv('JENKINS_ADMIN_ID')
def adminPassword = System.getenv('JENKINS_ADMIN_PASSWORD')

if (!adminId || !adminPassword) {
  throw new IllegalStateException('JENKINS_ADMIN_ID and JENKINS_ADMIN_PASSWORD are required')
}

def realm = new HudsonPrivateSecurityRealm(false)
if (realm.getUser(adminId) == null) {
  realm.createAccount(adminId, adminPassword)
}
instance.setSecurityRealm(realm)

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)
instance.save()
