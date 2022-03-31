package server_test

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"

	"github.com/dcrosby42/notingham/server"
	"github.com/go-resty/resty/v2"
	. "github.com/pepinns/go-hamcrest"
	"github.com/phayes/freeport"
)

type NotinghamFixture struct {
	Config server.Config
	Client *resty.Client
	wg     sync.WaitGroup
	done   chan os.Signal
}

func WithNotingham(t *testing.T, config server.Config, fn func(*NotinghamFixture)) {
	fix := NotinghamFixture{Config: config}
	fix.Start(t)
	defer fix.Stop(t)
	fn(&fix)
}

func (me *NotinghamFixture) Start(t *testing.T) {
	me.done = make(chan os.Signal, 1)
	me.Client = resty.New()
	if me.Config.BindHost == "" {
		me.Config.BindHost = "127.0.0.1"
	}
	if me.Config.BindPort == 0 {
		var err error
		me.Config.BindPort, err = freeport.GetFreePort()
		Assert(t).That(err, IsNil())
	}
	go func() {
		me.wg.Add(1)
		err := server.Serve(me.Config, me.done)
		Assert(t).That(err, IsNil())
		me.wg.Done()
	}()
dance:
	// ping loop  to await server readiness
	for d := time.Now().Add(5 * time.Second); time.Now().Before(d); {
		resp, err := me.Client.R().Get(me.Url("/ping"))
		if err == nil && resp.StatusCode() == 200 {
			break dance
		}
		time.Sleep(200 * time.Millisecond)
	}
}

func (me *NotinghamFixture) Stop(*testing.T) {
	me.done <- syscall.SIGINT
	me.wg.Wait()
}

func (me *NotinghamFixture) Url(path string) string {
	base := fmt.Sprintf("http://%s:%v", me.Config.BindHost, me.Config.BindPort)
	if len(path) > 0 {
		if !strings.HasPrefix(path, "/") {
			base += "/"
		}
		base += path
	}
	return base
}
func (me *NotinghamFixture) Api(path string, a ...interface{}) string {
	base := me.Url("/api/v1")
	path = fmt.Sprintf(path, a...)
	if !strings.HasPrefix(path, "/") {
		base += "/"
	}
	return base + path
}

func assertOk(t *testing.T, resp *resty.Response, err error) {
	t.Helper()
	Assert(t).That(err, IsNil())
	if resp.StatusCode() != 200 {
		t.Logf("Non-ok response: %s", string(resp.Body()))
	}
	Assert(t).That(resp.StatusCode(), Equals(200))
}
